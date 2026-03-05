using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/v1/registration")]
[Authorize]
public class PatientRegistrationController : ControllerBase
{
    private readonly IPatientRegistrationService _service;
    private readonly ILogger<PatientRegistrationController> _logger;

    public PatientRegistrationController(
        IPatientRegistrationService service,
        ILogger<PatientRegistrationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Register new patient
    /// </summary>
    [HttpPost("register")]
    [RequirePermission("patient.create")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", 
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var tenantCode = Request.Headers["X-Tenant-Code"].ToString();
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _service.RegisterPatientAsync(request, tenantId, tenantCode, userId);

            return Ok(ApiResponse<PatientRegistrationResponse>.SuccessResponse(result,
                "Patient registered successfully"));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error during patient registration");
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while registering patient"));
        }
    }

    /// <summary>
    /// Check for duplicate patients before registration
    /// </summary>
    [HttpPost("check-duplicates")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> CheckDuplicates([FromBody] CheckDuplicateRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", 
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

            var result = await _service.CheckDuplicatesAsync(request, tenantId);

            return Ok(ApiResponse<DuplicateCheckResponse>.SuccessResponse(result,
                result.IsDuplicate ? "Potential duplicates found" : "No duplicates found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking duplicates");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while checking duplicates"));
        }
    }

    /// <summary>
    /// Quick search patients by UHID, mobile, or name
    /// </summary>
    [HttpPost("quick-search")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> QuickSearch([FromBody] QuickSearchRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", 
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

            var results = await _service.QuickSearchAsync(request, tenantId);

            return Ok(ApiResponse<List<QuickSearchResponse>>.SuccessResponse(results,
                $"Found {results.Count} patient(s)"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during quick search");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred during search"));
        }
    }

    /// <summary>
    /// Get patient by UHID
    /// </summary>
    [HttpGet("uhid/{uhid}")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetByUHID(string uhid)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

            var result = await _service.GetByUHIDAsync(uhid, tenantId);

            if (result == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            return Ok(ApiResponse<PatientRegistrationResponse>.SuccessResponse(result, "Patient found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving patient by UHID");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while retrieving patient"));
        }
    }
}
