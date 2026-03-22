using EMRService.Application;
using EMRService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Authorization;

namespace EMRService.Controllers;

[ApiController]
[Route("api/emr")]
[Authorize]
public class EMRController : ControllerBase
{
    private readonly IEMRService _emrService;
    private readonly ILogger<EMRController> _logger;

    public EMRController(IEMRService emrService, ILogger<EMRController> logger)
    {
        _emrService = emrService;
        _logger = logger;
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"]!);
    private string TenantCode => Request.Headers["X-Tenant-Code"]!;
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"]!);
    private Guid DoctorId => Guid.Parse(User.FindFirst("DoctorId")?.Value ?? UserId.ToString());

    [HttpPost("encounters")]
    [RequirePermission("encounter.create")]
    public async Task<IActionResult> CreateEncounter([FromBody] CreateEncounterRequest request)
    {
        try
        {
            var encounter = await _emrService.CreateEncounterAsync(request, TenantId, TenantCode, UserId);
            return Ok(new ApiResponse<object>(true, "Encounter created successfully", encounter));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating encounter");
            return BadRequest(new ApiResponse<object>(false, "Failed to create encounter", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/{id}")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetEncounter(Guid id)
    {
        try
        {
            var encounter = await _emrService.GetEncounterAsync(id, TenantId);
            if (encounter == null) return NotFound(new ApiResponse<object>(false, "Encounter not found", null));
            return Ok(new ApiResponse<object>(true, "Encounter retrieved successfully", encounter));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving encounter");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve encounter", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/by-patient/{patientId}")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetPatientEncounters(Guid patientId)
    {
        try
        {
            var encounters = await _emrService.GetPatientEncountersAsync(patientId, TenantId);
            return Ok(new ApiResponse<object>(true, "Encounters retrieved successfully", encounters));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving patient encounters");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve encounters", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("encounters/{id}/close")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> CloseEncounter(Guid id)
    {
        try
        {
            var closed = await _emrService.CloseEncounterAsync(id, TenantId, UserId, DoctorId);
            return Ok(new ApiResponse<object>(true, "Encounter closed successfully", new { Closed = closed }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing encounter");
            return BadRequest(new ApiResponse<object>(false, "Failed to close encounter", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("encounters/{id}/notes")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> AddClinicalNote(Guid id, [FromBody] CreateClinicalNoteRequest request)
    {
        try
        {
            var note = await _emrService.AddClinicalNoteAsync(id, request, TenantId, UserId, DoctorId);
            return Ok(new ApiResponse<object>(true, "Clinical note added successfully", note));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding clinical note");
            return BadRequest(new ApiResponse<object>(false, "Failed to add clinical note", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/{id}/notes")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetClinicalNotes(Guid id)
    {
        try
        {
            var notes = await _emrService.GetClinicalNotesAsync(id, TenantId);
            return Ok(new ApiResponse<object>(true, "Clinical notes retrieved successfully", notes));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving clinical notes");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve clinical notes", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("encounters/{id}/vitals")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> AddVital(Guid id, [FromBody] CreateVitalRequest request)
    {
        try
        {
            var vital = await _emrService.AddVitalAsync(id, request, TenantId, UserId);
            return Ok(new ApiResponse<object>(true, "Vital added successfully", vital));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding vital");
            return BadRequest(new ApiResponse<object>(false, "Failed to add vital", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/{id}/vitals")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetVitals(Guid id)
    {
        try
        {
            var vitals = await _emrService.GetVitalsAsync(id, TenantId);
            return Ok(new ApiResponse<object>(true, "Vitals retrieved successfully", vitals));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vitals");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve vitals", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("encounters/{id}/diagnosis")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> AddDiagnosis(Guid id, [FromBody] CreateDiagnosisRequest request)
    {
        try
        {
            var diagnosis = await _emrService.AddDiagnosisAsync(id, request, TenantId, UserId);
            return Ok(new ApiResponse<object>(true, "Diagnosis added successfully", diagnosis));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding diagnosis");
            return BadRequest(new ApiResponse<object>(false, "Failed to add diagnosis", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/{id}/diagnosis")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetDiagnoses(Guid id)
    {
        try
        {
            var diagnoses = await _emrService.GetDiagnosesAsync(id, TenantId);
            return Ok(new ApiResponse<object>(true, "Diagnoses retrieved successfully", diagnoses));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving diagnoses");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve diagnoses", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("patients/{patientId}/allergies")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> AddAllergy(Guid patientId, [FromBody] CreateAllergyRequest request)
    {
        try
        {
            var allergy = await _emrService.AddAllergyAsync(patientId, request, TenantId, UserId);
            return Ok(new ApiResponse<object>(true, "Allergy added successfully", allergy));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding allergy");
            return BadRequest(new ApiResponse<object>(false, "Failed to add allergy", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("patients/{patientId}/allergies")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetAllergies(Guid patientId)
    {
        try
        {
            var allergies = await _emrService.GetAllergiesAsync(patientId, TenantId);
            return Ok(new ApiResponse<object>(true, "Allergies retrieved successfully", allergies));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allergies");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve allergies", null, new List<string> { ex.Message }));
        }
    }

    [HttpPost("encounters/{id}/procedures")]
    [RequirePermission("encounter.update")]
    public async Task<IActionResult> AddProcedure(Guid id, [FromBody] CreateProcedureRequest request)
    {
        try
        {
            var procedure = await _emrService.AddProcedureAsync(id, request, TenantId, UserId);
            return Ok(new ApiResponse<object>(true, "Procedure added successfully", procedure));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding procedure");
            return BadRequest(new ApiResponse<object>(false, "Failed to add procedure", null, new List<string> { ex.Message }));
        }
    }

    [HttpGet("encounters/{id}/procedures")]
    [RequirePermission("encounter.view")]
    public async Task<IActionResult> GetProcedures(Guid id)
    {
        try
        {
            var procedures = await _emrService.GetProceduresAsync(id, TenantId);
            return Ok(new ApiResponse<object>(true, "Procedures retrieved successfully", procedures));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving procedures");
            return BadRequest(new ApiResponse<object>(false, "Failed to retrieve procedures", null, new List<string> { ex.Message }));
        }
    }
}
