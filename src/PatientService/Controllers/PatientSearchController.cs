using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientSearchController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<PatientSearchController> _logger;

    public PatientSearchController(IPatientService patientService, ILogger<PatientSearchController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    [HttpGet("search")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> SearchPatients([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            
            var searchRequest = new PatientSearchRequest
            {
                SearchTerm = q,
                PageNumber = page,
                PageSize = size
            };

            var result = await _patientService.SearchPatientsAsync(searchRequest, tenantId);
            return Ok(ApiResponse<PagedResult<PatientResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching patients");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to search patients"));
        }
    }

    [HttpGet("quick-search")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> QuickSearch([FromQuery] string q, [FromQuery] int maxResults = 10)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var limit = maxResults is > 0 and <= 50 ? maxResults : 10;

            var request = new QuickSearchRequest
            {
                SearchTerm = q,
                MaxResults = limit
            };

            var result = await _patientService.QuickSearchAsync(request, tenantId);
            return Ok(ApiResponse<List<QuickSearchResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in quick search");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to search"));
        }
    }

    [HttpGet("recent")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetRecentPatients([FromQuery] int limit = 10)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var result = await _patientService.GetRecentPatientsAsync(tenantId, limit);
            return Ok(ApiResponse<List<QuickSearchResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent patients");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get recent patients"));
        }
    }

    [HttpGet("{id}")]
    [RequirePermission("patient.view")]
    [ApiExplorerSettings(IgnoreApi = true)] // Served by OptimizedPatientController /v2/{id}
    public async Task<IActionResult> GetPatientById(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var patient = await _patientService.GetPatientByIdAsync(id, tenantId);

            if (patient == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get patient"));
        }
    }
}