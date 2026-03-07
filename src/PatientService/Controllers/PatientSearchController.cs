using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
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
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist,Accountant")]
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
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist,Accountant")]
    public async Task<IActionResult> QuickSearch([FromQuery] string q)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            
            var request = new QuickSearchRequest
            {
                SearchTerm = q,
                MaxResults = 10
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
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist,Accountant")]
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
}