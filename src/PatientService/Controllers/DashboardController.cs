using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Dapper;
using Npgsql;

namespace PatientService.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public DashboardController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var summary = new DashboardSummary();

        // Patient Stats
        using (var conn = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection")))
        {
            var sql = @"
                SELECT 
                    COUNT(*) FILTER (WHERE is_deleted = false) as TotalPatients,
                    COUNT(*) FILTER (WHERE DATE(registration_date) = CURRENT_DATE AND is_deleted = false) as TodayRegistrations
                FROM patients WHERE tenant_id = @TenantId";
            
            var result = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { TenantId = tenantId });
            summary.TotalPatients = result?.totalpatients ?? 0;
            summary.TodayRegistrations = result?.todayregistrations ?? 0;
        }

        // Encounter Stats
        var encounterConnStr = _configuration.GetConnectionString("EncounterConnection");
        if (!string.IsNullOrEmpty(encounterConnStr))
        {
            try
            {
                using var conn = new NpgsqlConnection(encounterConnStr);
                var sql = @"
                    SELECT
                        COUNT(*) FILTER (WHERE is_deleted = false) as TotalEncounters,
                        COUNT(*) FILTER (WHERE DATE(encounter_date) = CURRENT_DATE AND is_deleted = false) as TodayVisits,
                        COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as ActiveEncounters
                    FROM encounters WHERE tenant_id = @TenantId";
                var result = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { TenantId = tenantId });
                summary.TotalEncounters = result?.totalencounters ?? 0;
                summary.TodayVisits = result?.todayvisits ?? 0;
                summary.ActiveEncounters = result?.activeencounters ?? 0;
            }
            catch { /* Encounter service unavailable */ }
        }

        // Billing Stats
        var billingConnStr = _configuration.GetConnectionString("BillingConnection");
        if (!string.IsNullOrEmpty(billingConnStr))
        using (var conn = new NpgsqlConnection(billingConnStr))
        {
            try
            {
                var sql = @"
                    SELECT
                        COUNT(*) FILTER (WHERE is_deleted = false) as TotalInvoices,
                        COALESCE(SUM(grand_total) FILTER (WHERE is_deleted = false), 0) as TotalRevenue,
                        COALESCE(SUM(grand_total) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND is_deleted = false), 0) as TodayRevenue,
                        COALESCE(SUM(paid_amount) FILTER (WHERE is_deleted = false), 0) as TotalCollected,
                        COALESCE(SUM(grand_total - paid_amount) FILTER (WHERE status != 'Paid' AND is_deleted = false), 0) as PendingAmount,
                        COUNT(*) FILTER (WHERE status = 'Pending' AND is_deleted = false) as PendingInvoices
                    FROM invoices WHERE tenant_id = @TenantId";
                var result = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { TenantId = tenantId });
                summary.TotalInvoices = result?.totalinvoices ?? 0;
                summary.TotalRevenue = result?.totalrevenue ?? 0;
                summary.TodayRevenue = result?.todayrevenue ?? 0;
                summary.TotalCollected = result?.totalcollected ?? 0;
                summary.PendingAmount = result?.pendingamount ?? 0;
                summary.PendingInvoices = result?.pendinginvoices ?? 0;
            }
            catch { /* Billing service unavailable */ }
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = summary
        });
    }
}

public class DashboardSummary
{
    public long TotalPatients { get; set; }
    public long TodayRegistrations { get; set; }
    public long TotalEncounters { get; set; }
    public long TodayVisits { get; set; }
    public long ActiveEncounters { get; set; }
    public long TotalInvoices { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal PendingAmount { get; set; }
    public long PendingInvoices { get; set; }
}
