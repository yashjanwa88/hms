using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patient/v1/patients")]
[Authorize]
public class PatientV1Controller : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientV1Controller(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetPatientById(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var patient = await _patientService.GetPatientByIdAsync(id, tenantId);

            if (patient == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<object>.SuccessResponse(patient, "Success"));
        }
        catch
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get patient"));
        }
    }
}