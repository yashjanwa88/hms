using BillingService.DTOs;
using BillingService.Repositories;
using Shared.Common.Models;

namespace BillingService.Application;

public interface IReportsService
{
    Task<PagedResult<ARAgingResponse>> GetARAgingReportAsync(ARAgingRequest request, Guid tenantId);
    Task<ARAgingSummaryResponse> GetARAgingSummaryAsync(ARAgingRequest request, Guid tenantId);
    Task<List<RevenueReportResponse>> GetRevenueReportAsync(RevenueReportRequest request, Guid tenantId);
    Task<object> GetDashboardStatsAsync(Guid tenantId);
}

public class ReportsService : IReportsService
{
    private readonly IReportsRepository _reportsRepository;

    public ReportsService(IReportsRepository reportsRepository)
    {
        _reportsRepository = reportsRepository;
    }

    public async Task<PagedResult<ARAgingResponse>> GetARAgingReportAsync(ARAgingRequest request, Guid tenantId)
    {
        return await _reportsRepository.GetARAgingReportAsync(request, tenantId);
    }

    public async Task<ARAgingSummaryResponse> GetARAgingSummaryAsync(ARAgingRequest request, Guid tenantId)
    {
        return await _reportsRepository.GetARAgingSummaryAsync(request, tenantId);
    }

    public async Task<List<RevenueReportResponse>> GetRevenueReportAsync(RevenueReportRequest request, Guid tenantId)
    {
        return await _reportsRepository.GetRevenueReportAsync(request, tenantId);
    }

    public async Task<object> GetDashboardStatsAsync(Guid tenantId)
    {
        return await _reportsRepository.GetDashboardStatsAsync(tenantId);
    }
}