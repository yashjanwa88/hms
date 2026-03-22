using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/{patientId:guid}/billing")]
[Authorize]
public class BillingHistoryController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<BillingHistoryController> _logger;

    public BillingHistoryController(IConfiguration config, ILogger<BillingHistoryController> logger)
    {
        _config = config;
        _logger = logger;
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

    // ── GET /api/patients/{patientId}/billing ──────────────────────────────────

    [HttpGet]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetBillingHistory(
        Guid patientId,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var connStr = _config.GetConnectionString("BillingConnection");

        if (string.IsNullOrEmpty(connStr))
        {
            _logger.LogWarning("BillingConnection not configured. Returning empty billing history.");
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items = Array.Empty<object>(),
                totalCount = 0,
                pageNumber,
                pageSize,
                summary = new { totalAmount = 0, totalPaid = 0, totalBalance = 0 }
            }, "Billing service not connected"));
        }

        try
        {
            using var conn = new NpgsqlConnection(connStr);

            var where = "WHERE i.patient_id = @PatientId AND i.tenant_id = @TenantId AND i.is_deleted = false";
            var p = new DynamicParameters();
            p.Add("PatientId", patientId);
            p.Add("TenantId", TenantId);

            if (!string.IsNullOrEmpty(status) && status != "All")
            { where += " AND i.status = @Status"; p.Add("Status", status); }

            var offset = (pageNumber - 1) * pageSize;
            p.Add("PageSize", pageSize);
            p.Add("Offset", offset);

            var sql = $@"SELECT
                i.id as billId,
                i.invoice_number as invoiceNo,
                i.grand_total as amount,
                i.paid_amount as paid,
                (i.grand_total - i.paid_amount) as balance,
                i.status,
                i.created_at as billDate,
                i.payment_date as paymentDate,
                i.payment_mode as paymentMode,
                i.notes
                FROM invoices i
                {where}
                ORDER BY i.created_at DESC
                LIMIT @PageSize OFFSET @Offset";

            var countSql = $"SELECT COUNT(*) FROM invoices i {where}";

            var summarySql = $@"SELECT
                COALESCE(SUM(grand_total), 0) as totalAmount,
                COALESCE(SUM(paid_amount), 0) as totalPaid,
                COALESCE(SUM(grand_total - paid_amount), 0) as totalBalance
                FROM invoices i {where}";

            var items = await conn.QueryAsync<dynamic>(sql, p);
            var total = await conn.ExecuteScalarAsync<int>(countSql, p);
            var summary = await conn.QueryFirstOrDefaultAsync<dynamic>(summarySql, p);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items,
                totalCount = total,
                pageNumber,
                pageSize,
                summary = new
                {
                    totalAmount = (decimal)(summary?.totalamount ?? 0),
                    totalPaid = (decimal)(summary?.totalpaid ?? 0),
                    totalBalance = (decimal)(summary?.totalbalance ?? 0)
                }
            }, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch billing history for patient {PatientId}", patientId);
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items = Array.Empty<object>(),
                totalCount = 0,
                pageNumber,
                pageSize,
                summary = new { totalAmount = 0, totalPaid = 0, totalBalance = 0 }
            }, "Billing service unavailable"));
        }
    }
}
