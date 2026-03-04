using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<PatientController> _logger;

    public PatientController(IPatientService patientService, ILogger<PatientController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist")]
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var tenantCode = Request.Headers["X-Tenant-Code"].ToString();
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var patient = await _patientService.CreatePatientAsync(request, tenantId, tenantCode, userId);

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Patient registered successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to create patient"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous] // Allow internal service calls
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

    [HttpGet("uhid/{uhid}")]
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist,Accountant")]
    public async Task<IActionResult> GetPatientByUHID(string uhid)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var patient = await _patientService.GetPatientByUHIDAsync(uhid, tenantId);

            if (patient == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient by UHID");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get patient"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist")]
    public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _patientService.UpdatePatientAsync(id, request, tenantId, userId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Patient updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update patient"));
        }
    }

    [HttpGet("search")]
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist,Accountant")]
    public async Task<IActionResult> SearchPatients([FromQuery] PatientSearchRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var result = await _patientService.SearchPatientsAsync(request, tenantId);

            return Ok(ApiResponse<PagedResult<PatientResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching patients");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to search patients"));
        }
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("patient.delete")]
    public async Task<IActionResult> DeactivatePatient(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _patientService.DeactivatePatientAsync(id, tenantId, userId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Patient deactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to deactivate patient"));
        }
    }

    [HttpPost("check-duplicates")]
    [Authorize(Roles = "Admin,HospitalAdmin,Doctor,Nurse,Receptionist")]
    public async Task<IActionResult> CheckDuplicates([FromBody] CreatePatientRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            
            var result = await _patientService.CheckDuplicatesAsync(
                request.MobileNumber, 
                request.FirstName, 
                request.LastName, 
                request.DateOfBirth, 
                tenantId
            );

            return Ok(ApiResponse<DuplicateCheckResponse>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking duplicates");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to check duplicates"));
        }
    }

    [HttpPost("merge")]
    [RequirePermission("patient.merge")]
    public async Task<IActionResult> MergePatients([FromBody] MergePatientRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _patientService.MergePatientsAsync(request, tenantId, userId);

            if (!result)
                return BadRequest(ApiResponse<object>.ErrorResponse("Failed to merge patients"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Patients merged successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error merging patients");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to merge patients"));
        }
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,HospitalAdmin")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var stats = await _patientService.GetStatsAsync(tenantId);

            return Ok(ApiResponse<PatientStatsResponse>.SuccessResponse(stats, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stats");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get stats"));
        }
    }

    [HttpPost("{id}/increment-visit")]
    [AllowAnonymous] // Allow internal service calls
    public async Task<IActionResult> IncrementVisitCount(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var result = await _patientService.IncrementVisitCountAsync(id, tenantId);

            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Visit count incremented"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing visit count");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to increment visit count"));
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "patient-service", timestamp = DateTime.UtcNow });
    }
}
