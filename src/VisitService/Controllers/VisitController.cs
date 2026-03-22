using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisitService.Application;
using VisitService.DTOs;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace VisitService.Controllers;

[ApiController]
[Route("api/visits")]
[Authorize]
public class VisitController : ControllerBase
{
    private readonly IVisitService _visitService;
    private readonly ILogger<VisitController> _logger;

    public VisitController(IVisitService visitService, ILogger<VisitController> logger)
    {
        _visitService = visitService;
        _logger = logger;
    }

    [HttpPost]
    [RequirePermission("encounter.create")]
    public async Task<IActionResult> CreateVisit([FromBody] CreateVisitRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var tenantCode = Request.Headers["X-Tenant-Code"].ToString();
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var visit = await _visitService.CreateVisitAsync(request, tenantId, tenantCode, userId);

            return Ok(ApiResponse<VisitResponse>.SuccessResponse(visit, "Visit created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to create visit"));
        }
    }

    [HttpPost("emergency")]
    [RequirePermission("encounter.create")]
    public async Task<IActionResult> CreateEmergencyVisit([FromBody] EmergencyVisitRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var tenantCode = Request.Headers["X-Tenant-Code"].ToString();
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var visit = await _visitService.CreateEmergencyVisitAsync(request, tenantId, tenantCode, userId);

            return Ok(ApiResponse<VisitResponse>.SuccessResponse(visit, "Emergency visit created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating emergency visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to create emergency visit"));
        }
    }

    [HttpGet("{id}")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetVisitById(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var visit = await _visitService.GetVisitByIdAsync(id, tenantId);

            if (visit == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Visit not found"));

            return Ok(ApiResponse<VisitResponse>.SuccessResponse(visit, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get visit"));
        }
    }

    [HttpGet("number/{visitNumber}")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetVisitByNumber(string visitNumber)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var visit = await _visitService.GetVisitByNumberAsync(visitNumber, tenantId);

            if (visit == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Visit not found"));

            return Ok(ApiResponse<VisitResponse>.SuccessResponse(visit, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit by number");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get visit"));
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> UpdateVisit(Guid id, [FromBody] UpdateVisitRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _visitService.UpdateVisitAsync(id, request, tenantId, userId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Visit not found"));

            return Ok(ApiResponse<object>.SuccessResponse(new object(), "Visit updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update visit"));
        }
    }

    [HttpPost("{id}/checkin")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> CheckInVisit(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _visitService.CheckInVisitAsync(id, tenantId, userId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Visit not found"));

            return Ok(ApiResponse<object>.SuccessResponse(new object(), "Patient checked in successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking in visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to check in visit"));
        }
    }

    [HttpPost("{id}/checkout")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> CheckOutVisit(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _visitService.CheckOutVisitAsync(id, tenantId, userId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Visit not found"));

            return Ok(ApiResponse<object>.SuccessResponse(new object(), "Patient checked out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking out visit");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to check out visit"));
        }
    }

    [HttpGet("search")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> SearchVisits([FromQuery] VisitSearchRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var result = await _visitService.SearchVisitsAsync(request, tenantId);

            return Ok(ApiResponse<PagedResult<VisitResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching visits");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to search visits"));
        }
    }

    [HttpGet("patient/{patientId}/history")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetPatientVisitHistory(Guid patientId)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var visits = await _visitService.GetPatientVisitHistoryAsync(patientId, tenantId);

            return Ok(ApiResponse<List<VisitResponse>>.SuccessResponse(visits, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient visit history");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get visit history"));
        }
    }

    [HttpPost("convert-to-ipd")]
    [RequirePermission("visit.ipd_convert")]
    public async Task<IActionResult> ConvertToIPD([FromBody] IPDConversionRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _visitService.ConvertToIPDAsync(request, tenantId, userId);

            if (!result)
                return BadRequest(ApiResponse<object>.ErrorResponse("Failed to convert visit to IPD"));

            return Ok(ApiResponse<object>.SuccessResponse(new object(), "Visit converted to IPD successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting visit to IPD");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to convert to IPD"));
        }
    }

    [HttpGet("active")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetActiveVisits()
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var visits = await _visitService.GetActiveVisitsAsync(tenantId);

            return Ok(ApiResponse<List<VisitResponse>>.SuccessResponse(visits, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active visits");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get active visits"));
        }
    }

    [HttpGet("{id}/timeline")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetVisitTimeline(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var timeline = await _visitService.GetVisitTimelineAsync(id, tenantId);

            return Ok(ApiResponse<List<VisitTimelineResponse>>.SuccessResponse(timeline, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit timeline");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get visit timeline"));
        }
    }

    [HttpGet("stats")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var stats = await _visitService.GetStatsAsync(tenantId);

            return Ok(ApiResponse<VisitStatsResponse>.SuccessResponse(stats, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit stats");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get stats"));
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "visit-service", timestamp = DateTime.UtcNow });
    }
}