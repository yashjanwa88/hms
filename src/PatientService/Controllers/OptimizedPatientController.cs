using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/v2")]
[Authorize]
public class OptimizedPatientController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<OptimizedPatientController> _logger;

    public OptimizedPatientController(IPatientService patientService, ILogger<OptimizedPatientController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    [HttpPost]
    [RequirePermission("patient.create")]
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientRequest request)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantInfo(out var tenantId, out var tenantCode, out var userId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing required headers"));
            }

            _logger.LogInformation("Creating patient request {RequestId} for tenant {TenantId}", requestId, tenantId);

            var patient = await _patientService.CreatePatientAsync(request, tenantId, tenantCode, userId);

            _logger.LogInformation("Patient created successfully with ID {PatientId} for request {RequestId}", 
                patient.Id, requestId);

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Patient registered successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Business rule violation in request {RequestId}: {Message}", requestId, ex.Message);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create patient for request {RequestId}", requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to create patient"));
        }
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetPatientById(Guid id)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

            var patient = await _patientService.GetPatientByIdAsync(id, tenantId);

            if (patient == null)
            {
                _logger.LogInformation("Patient {PatientId} not found for request {RequestId}", id, requestId);
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get patient {PatientId} for request {RequestId}", id, requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get patient"));
        }
    }

    [HttpGet("uhid/{uhid}")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetPatientByUHID(string uhid)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

            var patient = await _patientService.GetPatientByUHIDAsync(uhid, tenantId);

            if (patient == null)
            {
                _logger.LogInformation("Patient with UHID {UHID} not found for request {RequestId}", uhid, requestId);
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            return Ok(ApiResponse<PatientResponse>.SuccessResponse(patient, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get patient by UHID {UHID} for request {RequestId}", uhid, requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get patient"));
        }
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientRequest request)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantInfo(out var tenantId, out _, out var userId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing required headers"));
            }

            var result = await _patientService.UpdatePatientAsync(id, request, tenantId, userId);

            if (!result)
            {
                _logger.LogInformation("Patient {PatientId} not found for update in request {RequestId}", id, requestId);
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            _logger.LogInformation("Patient {PatientId} updated successfully for request {RequestId}", id, requestId);
            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Patient updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update patient {PatientId} for request {RequestId}", id, requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update patient"));
        }
    }

    [HttpGet("search")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> SearchPatients([FromQuery] PatientSearchRequest request)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

            // Validate pagination parameters
            if (request.PageSize > 100)
            {
                request.PageSize = 100; // Limit page size for performance
            }

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var result = await _patientService.SearchPatientsAsync(request, tenantId);
            stopwatch.Stop();

            _logger.LogInformation("Patient search completed in {ElapsedMs}ms for request {RequestId}, returned {Count} results", 
                stopwatch.ElapsedMilliseconds, requestId, result.Items.Count);

            return Ok(ApiResponse<PagedResult<PatientResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search patients for request {RequestId}", requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to search patients"));
        }
    }

    [HttpPost("{id:guid}/deactivate")]
    [RequirePermission("patient.delete")]
    public async Task<IActionResult> DeactivatePatient(Guid id)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantInfo(out var tenantId, out _, out var userId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing required headers"));
            }

            var result = await _patientService.DeactivatePatientAsync(id, tenantId, userId);

            if (!result)
            {
                _logger.LogInformation("Patient {PatientId} not found for deactivation in request {RequestId}", id, requestId);
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            _logger.LogInformation("Patient {PatientId} deactivated successfully for request {RequestId}", id, requestId);
            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Patient deactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate patient {PatientId} for request {RequestId}", id, requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to deactivate patient"));
        }
    }

    [HttpPost("check-duplicates")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> CheckDuplicates([FromBody] CreatePatientRequest request)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

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
            _logger.LogError(ex, "Failed to check duplicates for request {RequestId}", requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to check duplicates"));
        }
    }

    [HttpPost("merge")]
    [RequirePermission("patient.merge")]
    public async Task<IActionResult> MergePatients([FromBody] MergePatientRequest request)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantInfo(out var tenantId, out _, out var userId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing required headers"));
            }

            if (request.PrimaryPatientId == request.SecondaryPatientId)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Cannot merge patient with itself"));
            }

            var result = await _patientService.MergePatientsAsync(request, tenantId, userId);

            if (!result)
            {
                _logger.LogWarning("Failed to merge patients {SecondaryId} -> {PrimaryId} for request {RequestId}", 
                    request.SecondaryPatientId, request.PrimaryPatientId, requestId);
                return BadRequest(ApiResponse<object>.ErrorResponse("Failed to merge patients"));
            }

            _logger.LogInformation("Patients merged successfully {SecondaryId} -> {PrimaryId} for request {RequestId}", 
                request.SecondaryPatientId, request.PrimaryPatientId, requestId);
            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Patients merged successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to merge patients for request {RequestId}", requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to merge patients"));
        }
    }

    [HttpGet("stats")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetStats()
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

            var stats = await _patientService.GetStatsAsync(tenantId);

            return Ok(ApiResponse<PatientStatsResponse>.SuccessResponse(stats, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get stats for request {RequestId}", requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get stats"));
        }
    }

    [HttpPost("{id:guid}/increment-visit")]
    [AllowAnonymous] // Allow internal service calls
    public async Task<IActionResult> IncrementVisitCount(Guid id)
    {
        var requestId = HttpContext.TraceIdentifier;
        
        try
        {
            if (!TryGetTenantId(out var tenantId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Missing tenant header"));
            }

            var result = await _patientService.IncrementVisitCountAsync(id, tenantId);

            if (!result)
            {
                _logger.LogInformation("Patient {PatientId} not found for visit increment in request {RequestId}", id, requestId);
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Visit count incremented"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to increment visit count for patient {PatientId} in request {RequestId}", id, requestId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to increment visit count"));
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { 
            status = "healthy", 
            service = "patient-service", 
            timestamp = DateTime.UtcNow,
            version = "1.1.0-optimized"
        });
    }

    private bool TryGetTenantInfo(out Guid tenantId, out string tenantCode, out Guid userId)
    {
        tenantId = Guid.Empty;
        tenantCode = string.Empty;
        userId = Guid.Empty;

        return Guid.TryParse(Request.Headers["X-Tenant-Id"].ToString(), out tenantId) &&
               !string.IsNullOrEmpty(tenantCode = Request.Headers["X-Tenant-Code"].ToString()) &&
               Guid.TryParse(Request.Headers["X-User-Id"].ToString(), out userId);
    }

    private bool TryGetTenantId(out Guid tenantId)
    {
        return Guid.TryParse(Request.Headers["X-Tenant-Id"].ToString(), out tenantId);
    }
}