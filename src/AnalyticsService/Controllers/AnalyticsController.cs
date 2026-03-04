using AnalyticsService.Application;
using AnalyticsService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace AnalyticsService.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("revenue/daily")]
    [Authorize(Roles = "HospitalAdmin,Accountant")]
    public async Task<IActionResult> GetDailyRevenue([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetDailyRevenueAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<RevenueResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<RevenueResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("revenue/monthly")]
    [Authorize(Roles = "HospitalAdmin,Accountant")]
    public async Task<IActionResult> GetMonthlyRevenue([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetMonthlyRevenueAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<RevenueResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<RevenueResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("revenue/yearly")]
    [Authorize(Roles = "HospitalAdmin,Accountant")]
    public async Task<IActionResult> GetYearlyRevenue([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetYearlyRevenueAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<RevenueResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<RevenueResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("doctors/performance")]
    [Authorize(Roles = "HospitalAdmin,Doctor")]
    public async Task<IActionResult> GetDoctorPerformance([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetDoctorPerformanceAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<DoctorPerformanceResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<DoctorPerformanceResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("insurance/summary")]
    [Authorize(Roles = "HospitalAdmin,Accountant")]
    public async Task<IActionResult> GetInsuranceSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetInsuranceSummaryAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<InsuranceSummaryResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<InsuranceSummaryResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("insurance/approval-rate")]
    [Authorize(Roles = "HospitalAdmin,Accountant")]
    public async Task<IActionResult> GetInsuranceApprovalRate()
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetInsuranceApprovalRateAsync(tenantId);
            return Ok(ApiResponse<List<InsuranceApprovalRateResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<InsuranceApprovalRateResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("patients/summary")]
    [Authorize(Roles = "HospitalAdmin,Doctor")]
    public async Task<IActionResult> GetPatientSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetPatientSummaryAsync(fromDate, toDate, tenantId);
            return Ok(ApiResponse<List<PatientSummaryResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<PatientSummaryResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "HospitalAdmin,Accountant,Doctor")]
    public async Task<IActionResult> GetDashboard()
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _analyticsService.GetDashboardAsync(tenantId);
            return Ok(ApiResponse<DashboardResponse>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<DashboardResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "AnalyticsService", timestamp = DateTime.UtcNow });
    }
}
