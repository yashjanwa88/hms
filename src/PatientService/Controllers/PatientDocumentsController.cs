using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/{patientId:guid}/documents")]
[Authorize]
public class PatientDocumentsController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<PatientDocumentsController> _logger;
    private readonly string _uploadRoot;

    // Allowed MIME types
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf", "image/jpeg", "image/jpg", "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public PatientDocumentsController(IConfiguration config, ILogger<PatientDocumentsController> logger)
    {
        _config = config;
        _logger = logger;
        _uploadRoot = config["FileStorage:UploadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads", "patient-documents");
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());
    private string UserName => Request.Headers["X-User-Name"].ToString();

    private NpgsqlConnection CreateConnection() =>
        new(_config.GetConnectionString("DefaultConnection"));

    // ── GET /api/patients/{patientId}/documents ────────────────────────────────

    [HttpGet]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetDocuments(
        Guid patientId,
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        using var conn = CreateConnection();

        var where = "WHERE d.patient_id = @PatientId AND d.tenant_id = @TenantId AND d.is_deleted = false";
        var p = new DynamicParameters();
        p.Add("PatientId", patientId);
        p.Add("TenantId", TenantId);

        if (!string.IsNullOrEmpty(category) && category != "All")
        { where += " AND d.category = @Category"; p.Add("Category", category); }

        if (!string.IsNullOrEmpty(search))
        { where += " AND (d.file_name ILIKE @Search OR d.description ILIKE @Search)"; p.Add("Search", $"%{search}%"); }

        var sql = $@"SELECT
            d.id, d.patient_id as patientId, d.file_name as fileName,
            d.original_file_name as originalFileName, d.file_type as fileType,
            d.file_size as fileSize, d.category, d.sub_category as subCategory,
            d.description, d.document_date as documentDate, d.expiry_date as expiryDate,
            d.is_confidential as isConfidential, d.access_level as accessLevel,
            d.tags, d.version, d.is_latest_version as isLatestVersion,
            d.download_count as downloadCount, d.uploaded_by as uploadedBy,
            d.uploaded_by_name as uploadedByName, d.notes,
            d.created_at as uploadedDate
            FROM patient_documents d
            {where}
            ORDER BY d.created_at DESC";

        var docs = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(ApiResponse<object>.SuccessResponse(docs, "Success"));
    }

    // ── POST /api/patients/{patientId}/documents ───────────────────────────────

    [HttpPost]
    [RequirePermission("patient.update")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocuments(
        Guid patientId,
        [FromForm] string category,
        [FromForm] string? subCategory,
        [FromForm] string? description,
        [FromForm] string? documentDate,
        [FromForm] bool isConfidential = false,
        [FromForm] string? tags = null,
        [FromForm] string? notes = null)
    {
        var files = Request.Form.Files;
        if (files.Count == 0)
            return BadRequest(ApiResponse<object>.ErrorResponse("No files uploaded"));

        // Validate all files first
        foreach (var file in files)
        {
            if (file.Length > MaxFileSizeBytes)
                return BadRequest(ApiResponse<object>.ErrorResponse($"File '{file.FileName}' exceeds 10MB limit"));

            if (!AllowedTypes.Contains(file.ContentType))
                return BadRequest(ApiResponse<object>.ErrorResponse($"File type '{file.ContentType}' not allowed"));
        }

        var uploaded = new List<object>();
        using var conn = CreateConnection();

        foreach (var file in files)
        {
            var docId = Guid.NewGuid();
            var ext = Path.GetExtension(file.FileName);
            var safeFileName = $"{docId}{ext}";

            // Build storage path: uploads/patient-documents/{tenantId}/{patientId}/
            var dir = Path.Combine(_uploadRoot, TenantId.ToString(), patientId.ToString());
            Directory.CreateDirectory(dir);
            var fullPath = Path.Combine(dir, safeFileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
                await file.CopyToAsync(stream);

            // Relative path stored in DB (portable)
            var relativePath = Path.Combine(TenantId.ToString(), patientId.ToString(), safeFileName)
                .Replace('\\', '/');

            await conn.ExecuteAsync(@"INSERT INTO patient_documents
                (id, tenant_id, patient_id, file_name, original_file_name, file_type, file_size,
                 file_path, category, sub_category, description, document_date, is_confidential,
                 tags, notes, uploaded_by, uploaded_by_name, created_at, created_by, is_deleted)
                VALUES (@Id, @TenantId, @PatientId, @FileName, @OriginalFileName, @FileType, @FileSize,
                 @FilePath, @Category, @SubCategory, @Description, @DocumentDate, @IsConfidential,
                 @Tags, @Notes, @UploadedBy, @UploadedByName, NOW(), @CreatedBy, false)",
                new
                {
                    Id = docId, TenantId, PatientId = patientId,
                    FileName = safeFileName,
                    OriginalFileName = file.FileName,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    FilePath = relativePath,
                    Category = category,
                    SubCategory = subCategory,
                    Description = description,
                    DocumentDate = string.IsNullOrEmpty(documentDate) ? (DateTime?)null : DateTime.Parse(documentDate),
                    IsConfidential = isConfidential,
                    Tags = tags,
                    Notes = notes,
                    UploadedBy = UserId,
                    UploadedByName = string.IsNullOrEmpty(UserName) ? "System" : UserName,
                    CreatedBy = UserId
                });

            uploaded.Add(new { id = docId, fileName = file.FileName, fileSize = file.Length });
        }

        _logger.LogInformation("Uploaded {Count} documents for patient {PatientId}", uploaded.Count, patientId);
        return Ok(ApiResponse<object>.SuccessResponse(new { uploaded, count = uploaded.Count }, "Documents uploaded successfully"));
    }

    // ── DELETE /api/patients/{patientId}/documents/{docId} ────────────────────

    [HttpDelete("{docId:guid}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteDocument(Guid patientId, Guid docId)
    {
        using var conn = CreateConnection();

        // Get file path before soft-delete so we can optionally remove from disk
        var filePath = await conn.ExecuteScalarAsync<string?>(
            "SELECT file_path FROM patient_documents WHERE id = @Id AND patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false",
            new { Id = docId, PatientId = patientId, TenantId });

        if (filePath == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));

        var rows = await conn.ExecuteAsync(
            "UPDATE patient_documents SET is_deleted = true, updated_at = NOW(), updated_by = @UserId WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = docId, TenantId, UserId });

        if (rows == 0)
            return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));

        // Physical file removal (best-effort, non-blocking)
        try
        {
            var fullPath = Path.Combine(_uploadRoot, filePath.Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Could not delete physical file {Path}: {Msg}", filePath, ex.Message);
        }

        return Ok(ApiResponse<object>.SuccessResponse(null, "Document deleted"));
    }

    // ── GET /api/patients/{patientId}/documents/{docId}/download ──────────────

    [HttpGet("{docId:guid}/download")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> DownloadDocument(Guid patientId, Guid docId)
    {
        using var conn = CreateConnection();

        var doc = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT file_path, original_file_name as originalFileName, file_type as fileType, is_confidential as isConfidential
              FROM patient_documents
              WHERE id = @Id AND patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false",
            new { Id = docId, PatientId = patientId, TenantId });

        if (doc == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));

        var fullPath = Path.Combine(_uploadRoot, ((string)doc.file_path).Replace('/', Path.DirectorySeparatorChar));
        if (!System.IO.File.Exists(fullPath))
            return NotFound(ApiResponse<object>.ErrorResponse("File not found on server"));

        // Increment download count (fire-and-forget)
        _ = conn.ExecuteAsync(
            "UPDATE patient_documents SET download_count = download_count + 1, last_accessed_date = NOW(), last_accessed_by = @UserId WHERE id = @Id",
            new { Id = docId, UserId });

        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);
        var contentType = (string)doc.fileType ?? "application/octet-stream";
        var fileName = (string)doc.originalFileName ?? "document";

        Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"");
        return File(bytes, contentType, fileName);
    }
}
