using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using PatientService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;
using System.Text;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class ExportImportController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<ExportImportController> _logger;

    public ExportImportController(IConfiguration config, ILogger<ExportImportController> logger)
    {
        _config = config;
        _logger = logger;
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());

    [HttpPost("export")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> Export([FromBody] ExportRequest request)
    {
        using var conn = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));

        var where = "WHERE p.tenant_id = @TenantId AND p.is_deleted = false";
        var p = new DynamicParameters();
        p.Add("TenantId", TenantId);

        if (!string.IsNullOrEmpty(request.Status) && request.Status != "All")
        { where += " AND p.status = @Status"; p.Add("Status", request.Status); }
        if (request.FromDate.HasValue)
        { where += " AND p.registration_date >= @FromDate"; p.Add("FromDate", request.FromDate); }
        if (request.ToDate.HasValue)
        { where += " AND p.registration_date <= @ToDate"; p.Add("ToDate", request.ToDate.Value.AddDays(1)); }

        var sql = $@"SELECT p.uhid, p.first_name, p.middle_name, p.last_name, p.gender,
            p.date_of_birth, p.blood_group, p.marital_status, p.mobile_number, p.email,
            p.address_line1, p.city, p.state, p.pincode, p.status, p.registration_date,
            pt.type_name as patient_type, rt.type_name as registration_type
            FROM patients p
            LEFT JOIN patient_types pt ON pt.id = p.patient_type_id
            LEFT JOIN registration_types rt ON rt.id = p.registration_type_id
            {where} ORDER BY p.registration_date DESC LIMIT 10000";

        var rows = (await conn.QueryAsync<dynamic>(sql, p)).ToList();

        var csv = new StringBuilder();
        csv.AppendLine("UHID,FirstName,MiddleName,LastName,Gender,DateOfBirth,BloodGroup,MaritalStatus,Mobile,Email,Address,City,State,Pincode,Status,RegistrationDate,PatientType,RegistrationType");

        foreach (var row in rows)
        {
            csv.AppendLine(string.Join(",",
                EscapeCsv(row.uhid), EscapeCsv(row.first_name), EscapeCsv(row.middle_name),
                EscapeCsv(row.last_name), EscapeCsv(row.gender), EscapeCsv(row.date_of_birth?.ToString()),
                EscapeCsv(row.blood_group), EscapeCsv(row.marital_status), EscapeCsv(row.mobile_number),
                EscapeCsv(row.email), EscapeCsv(row.address_line1), EscapeCsv(row.city),
                EscapeCsv(row.state), EscapeCsv(row.pincode), EscapeCsv(row.status),
                EscapeCsv(row.registration_date?.ToString()), EscapeCsv(row.patient_type),
                EscapeCsv(row.registration_type)));
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"patients_export_{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(bytes, "text/csv", fileName);
    }

    [HttpPost("import")]
    [RequirePermission("patient.create")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.ErrorResponse("No file uploaded"));

        var jobId = Guid.NewGuid();
        var result = new ImportResultResponse { JobId = jobId, Status = "Completed" };
        var errors = new List<ImportErrorDetail>();
        int successCount = 0, row = 0;

        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        using var conn = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));

        // Skip header
        var header = await reader.ReadLineAsync();
        row = 1;

        while (!reader.EndOfStream)
        {
            row++;
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) continue;

            var cols = line.Split(',');
            if (cols.Length < 6)
            {
                errors.Add(new ImportErrorDetail { Row = row, Field = "General", Error = "Insufficient columns" });
                continue;
            }

            try
            {
                var firstName = cols[1].Trim();
                var lastName = cols[3].Trim();
                var gender = cols[4].Trim();
                var mobile = cols.Length > 8 ? cols[8].Trim() : null;

                if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(gender))
                {
                    errors.Add(new ImportErrorDetail { Row = row, Field = "FirstName/Gender", Error = "Required fields missing" });
                    continue;
                }

                // Check duplicate UHID
                var uhid = cols[0].Trim();
                if (!string.IsNullOrEmpty(uhid))
                {
                    var exists = await conn.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM patients WHERE uhid = @UHID AND tenant_id = @TenantId",
                        new { UHID = uhid, TenantId });
                    if (exists > 0)
                    {
                        errors.Add(new ImportErrorDetail { Row = row, Field = "UHID", Error = $"Duplicate UHID: {uhid}" });
                        continue;
                    }
                }

                await conn.ExecuteAsync(@"INSERT INTO patients (id, tenant_id, uhid, first_name, middle_name, last_name,
                    gender, date_of_birth, blood_group, marital_status, mobile_number, email,
                    address_line1, city, state, pincode, status, registration_date, created_at, created_by, is_deleted)
                    VALUES (gen_random_uuid(), @TenantId,
                    COALESCE(NULLIF(@UHID,''), 'IMP-' || to_char(NOW(),'YYYYMMDD') || '-' || floor(random()*9999)::text),
                    @FirstName, @MiddleName, @LastName, @Gender,
                    NULLIF(@DOB,'')::date, NULLIF(@BloodGroup,''), NULLIF(@MaritalStatus,''),
                    NULLIF(@Mobile,''), NULLIF(@Email,''), NULLIF(@Address,''),
                    NULLIF(@City,''), NULLIF(@State,''), NULLIF(@Pincode,''),
                    COALESCE(NULLIF(@Status,''),'Active'), CURRENT_DATE, NOW(), @CreatedBy, false)",
                    new
                    {
                        TenantId, UHID = uhid,
                        FirstName = firstName, MiddleName = cols.Length > 2 ? cols[2].Trim() : null,
                        LastName = lastName, Gender = gender,
                        DOB = cols.Length > 5 ? cols[5].Trim() : null,
                        BloodGroup = cols.Length > 6 ? cols[6].Trim() : null,
                        MaritalStatus = cols.Length > 7 ? cols[7].Trim() : null,
                        Mobile = mobile, Email = cols.Length > 9 ? cols[9].Trim() : null,
                        Address = cols.Length > 10 ? cols[10].Trim() : null,
                        City = cols.Length > 11 ? cols[11].Trim() : null,
                        State = cols.Length > 12 ? cols[12].Trim() : null,
                        Pincode = cols.Length > 13 ? cols[13].Trim() : null,
                        Status = cols.Length > 14 ? cols[14].Trim() : "Active",
                        CreatedBy = UserId
                    });
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Import row {Row} failed: {Msg}", row, ex.Message);
                errors.Add(new ImportErrorDetail { Row = row, Field = "General", Error = ex.Message });
            }
        }

        result.TotalRecords = row - 1;
        result.SuccessCount = successCount;
        result.FailedCount = errors.Count;
        result.Errors = errors;

        return Ok(ApiResponse<ImportResultResponse>.SuccessResponse(result, $"Import completed: {successCount} records imported"));
    }

    // Sanitize a single CSV cell: wrap in quotes, escape internal quotes, block formula injection
    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "\"\"";

        // Block Excel formula injection (=, +, -, @, TAB, CR at start)
        if (value.Length > 0 && "=+-@\t\r".Contains(value[0]))
            value = "'" + value;

        // Escape double-quotes by doubling them, then wrap in quotes
        return $"\"{value.Replace("\"", "\"\"")}\""; 
    }

    [HttpGet("import/template")]
    [RequirePermission("patient.view")]
    public IActionResult DownloadTemplate()
    {
        var csv = "UHID,FirstName,MiddleName,LastName,Gender,DateOfBirth,BloodGroup,MaritalStatus,Mobile,Email,Address,City,State,Pincode,Status,RegistrationDate,PatientType,RegistrationType\n" +
                  "PAT001,John,M,Doe,Male,1990-01-15,O+,Married,9876543210,john@example.com,123 Main St,Mumbai,Maharashtra,400001,Active,2024-01-15,General,General\n";
        var bytes = Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", "patient_import_template.csv");
    }
}
