using BillingService.Application;
using BillingService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace BillingService.Controllers;

[ApiController]
[Route("api/billing/v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;

    public ReportsController(IReportsService reportsService)
    {
        _reportsService = reportsService;
    }

    [HttpGet("ar-aging")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> GetARAgingReport([FromQuery] ARAgingRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _reportsService.GetARAgingReportAsync(request, tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "AR Aging report generated successfully",
            Data = result
        });
    }

    [HttpGet("ar-aging/summary")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> GetARAgingSummary([FromQuery] ARAgingRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _reportsService.GetARAgingSummaryAsync(request, tenantId);

        return Ok(new ApiResponse<ARAgingSummaryResponse>
        {
            Success = true,
            Message = "AR Aging summary generated successfully",
            Data = result
        });
    }

    [HttpGet("revenue")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> GetRevenueReport([FromQuery] RevenueReportRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _reportsService.GetRevenueReportAsync(request, tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Revenue report generated successfully",
            Data = result
        });
    }

    [HttpGet("dashboard-stats")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _reportsService.GetDashboardStatsAsync(tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Dashboard stats retrieved successfully",
            Data = result
        });
    }
}