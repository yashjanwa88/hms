using Dapper;
using BillingService.DTOs;
using Shared.Common.Models;
using Npgsql;

namespace BillingService.Repositories;

public interface IReportsRepository
{
    Task<PagedResult<ARAgingResponse>> GetARAgingReportAsync(ARAgingRequest request, Guid tenantId);
    Task<ARAgingSummaryResponse> GetARAgingSummaryAsync(ARAgingRequest request, Guid tenantId);
    Task<List<RevenueReportResponse>> GetRevenueReportAsync(RevenueReportRequest request, Guid tenantId);
    Task<object> GetDashboardStatsAsync(Guid tenantId);
}

public class ReportsRepository : IReportsRepository
{
    private readonly string _connectionString;

    public ReportsRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task<PagedResult<ARAgingResponse>> GetARAgingReportAsync(ARAgingRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var whereClause = "WHERE tenant_id = @TenantId";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (request.PatientId.HasValue)
        {
            whereClause += " AND patient_id = @PatientId";
            parameters.Add("PatientId", request.PatientId.Value);
        }

        var offset = (request.PageNumber - 1) * request.PageSize;

        var sql = $@"
            SELECT 
                patient_id as PatientId,
                invoice_number as InvoiceNumber,
                grand_total as GrandTotal,
                paid_amount as PaidAmount,
                outstanding_amount as OutstandingAmount,
                invoice_date as InvoiceDate,
                days_outstanding as DaysOutstanding,
                aging_bucket as AgingBucket,
                status as Status
            FROM ar_aging_report 
            {whereClause}
            ORDER BY days_outstanding DESC
            LIMIT @PageSize OFFSET @Offset";

        var countSql = $"SELECT COUNT(*) FROM ar_aging_report {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<ARAgingResponse>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<ARAgingResponse>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<ARAgingSummaryResponse> GetARAgingSummaryAsync(ARAgingRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                SUM(CASE WHEN aging_bucket = '0-30' THEN outstanding_amount ELSE 0 END) as Total0To30,
                SUM(CASE WHEN aging_bucket = '31-60' THEN outstanding_amount ELSE 0 END) as Total31To60,
                SUM(CASE WHEN aging_bucket = '61-90' THEN outstanding_amount ELSE 0 END) as Total61To90,
                SUM(CASE WHEN aging_bucket = '90+' THEN outstanding_amount ELSE 0 END) as TotalOver90,
                SUM(outstanding_amount) as GrandTotal,
                COUNT(*) as TotalInvoices
            FROM ar_aging_report 
            WHERE tenant_id = @TenantId";

        return await connection.QueryFirstOrDefaultAsync<ARAgingSummaryResponse>(sql, new { TenantId = tenantId }) 
            ?? new ARAgingSummaryResponse();
    }

    public async Task<List<RevenueReportResponse>> GetRevenueReportAsync(RevenueReportRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                DATE(created_at) as ReportDate,
                COUNT(*) as TotalInvoices,
                SUM(grand_total) as TotalRevenue,
                SUM(paid_amount) as TotalCollected,
                SUM(grand_total - paid_amount) as TotalOutstanding,
                CASE WHEN SUM(grand_total) > 0 THEN (SUM(paid_amount) / SUM(grand_total)) * 100 ELSE 0 END as CollectionRate
            FROM invoices 
            WHERE tenant_id = @TenantId 
                AND created_at >= @FromDate 
                AND created_at <= @ToDate
                AND is_deleted = false
            GROUP BY DATE(created_at)
            ORDER BY ReportDate DESC";

        var result = await connection.QueryAsync<RevenueReportResponse>(sql, new { 
            TenantId = tenantId, 
            FromDate = request.FromDate, 
            ToDate = request.ToDate 
        });

        return result.ToList();
    }

    public async Task<object> GetDashboardStatsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                COUNT(*) as TotalInvoices,
                SUM(grand_total) as TotalRevenue,
                SUM(paid_amount) as TotalCollected,
                SUM(grand_total - paid_amount) as TotalOutstanding,
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) as PendingInvoices,
                COUNT(CASE WHEN status = 'Paid' THEN 1 END) as PaidInvoices
            FROM invoices 
            WHERE tenant_id = @TenantId 
                AND is_deleted = false
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'";

        return await connection.QueryFirstOrDefaultAsync(sql, new { TenantId = tenantId }) ?? new { };
    }
}