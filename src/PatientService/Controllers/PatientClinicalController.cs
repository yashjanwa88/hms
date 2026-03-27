using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Application;
using PatientService.DTOs;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace PatientService.Controllers;

/// <summary>
/// Patient Clinical Data Controller
/// Manages allergies, chronic conditions, medications, immunizations, and documents
/// </summary>
[ApiController]
[Route("api/patient/v1/patients/{patientId}")]
[Authorize]
public class PatientClinicalController : ControllerBase
{
    private readonly IPatientClinicalService _clinicalService;
    private readonly ILogger<PatientClinicalController> _logger;

    public PatientClinicalController(
        IPatientClinicalService clinicalService,
        ILogger<PatientClinicalController> logger)
    {
        _clinicalService = clinicalService;
        _logger = logger;
    }

    private Guid GetTenantId() => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid? GetUserId() => Guid.TryParse(Request.Headers["X-User-Id"].ToString(), out var id) ? id : null;

    // =====================================================
    // ALLERGY ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all allergies for a patient
    /// </summary>
    [HttpGet("allergies")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetAllergies(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var allergies = await _clinicalService.GetAllergiesAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientAllergyDto>>.SuccessResponse(allergies));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allergies for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve allergies"));
        }
    }

    /// <summary>
    /// Get critical allergies only (Severe/Life-threatening)
    /// </summary>
    [HttpGet("allergies/critical")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetCriticalAllergies(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var allergies = await _clinicalService.GetCriticalAllergiesAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientAllergyDto>>.SuccessResponse(allergies));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving critical allergies for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve critical allergies"));
        }
    }

    /// <summary>
    /// Add new allergy
    /// </summary>
    [HttpPost("allergies")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> CreateAllergy(Guid patientId, [FromBody] CreatePatientAllergyRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var allergy = await _clinicalService.CreateAllergyAsync(patientId, tenantId, request, userId);
            return Ok(ApiResponse<PatientAllergyDto>.SuccessResponse(allergy, "Allergy added successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating allergy for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to add allergy"));
        }
    }

    /// <summary>
    /// Update allergy
    /// </summary>
    [HttpPut("allergies/{allergyId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdateAllergy(Guid patientId, Guid allergyId, [FromBody] UpdatePatientAllergyRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var allergy = await _clinicalService.UpdateAllergyAsync(allergyId, tenantId, request, userId);
            return Ok(ApiResponse<PatientAllergyDto>.SuccessResponse(allergy, "Allergy updated successfully"));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.ErrorResponse("Allergy not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating allergy {AllergyId}", allergyId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update allergy"));
        }
    }

    /// <summary>
    /// Delete allergy
    /// </summary>
    [HttpDelete("allergies/{allergyId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteAllergy(Guid patientId, Guid allergyId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _clinicalService.DeleteAllergyAsync(allergyId, tenantId);
            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Allergy not found"));
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Allergy deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting allergy {AllergyId}", allergyId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to delete allergy"));
        }
    }

    // =====================================================
    // CHRONIC CONDITION ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all chronic conditions for a patient
    /// </summary>
    [HttpGet("conditions")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetChronicConditions(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var conditions = await _clinicalService.GetChronicConditionsAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientChronicConditionDto>>.SuccessResponse(conditions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chronic conditions for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve chronic conditions"));
        }
    }

    /// <summary>
    /// Get active chronic conditions only
    /// </summary>
    [HttpGet("conditions/active")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetActiveConditions(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var conditions = await _clinicalService.GetActiveConditionsAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientChronicConditionDto>>.SuccessResponse(conditions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active conditions for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve active conditions"));
        }
    }

    /// <summary>
    /// Add new chronic condition
    /// </summary>
    [HttpPost("conditions")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> CreateChronicCondition(Guid patientId, [FromBody] CreatePatientChronicConditionRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var condition = await _clinicalService.CreateChronicConditionAsync(patientId, tenantId, request, userId);
            return Ok(ApiResponse<PatientChronicConditionDto>.SuccessResponse(condition, "Chronic condition added successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating chronic condition for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to add chronic condition"));
        }
    }

    /// <summary>
    /// Update chronic condition
    /// </summary>
    [HttpPut("conditions/{conditionId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdateChronicCondition(Guid patientId, Guid conditionId, [FromBody] UpdatePatientChronicConditionRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var condition = await _clinicalService.UpdateChronicConditionAsync(conditionId, tenantId, request, userId);
            return Ok(ApiResponse<PatientChronicConditionDto>.SuccessResponse(condition, "Chronic condition updated successfully"));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.ErrorResponse("Chronic condition not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating chronic condition {ConditionId}", conditionId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update chronic condition"));
        }
    }

    /// <summary>
    /// Delete chronic condition
    /// </summary>
    [HttpDelete("conditions/{conditionId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteChronicCondition(Guid patientId, Guid conditionId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _clinicalService.DeleteChronicConditionAsync(conditionId, tenantId);
            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Chronic condition not found"));
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Chronic condition deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting chronic condition {ConditionId}", conditionId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to delete chronic condition"));
        }
    }

    // =====================================================
    // MEDICATION HISTORY ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all medications (current and past) for a patient
    /// </summary>
    [HttpGet("medications")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetMedicationHistory(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var medications = await _clinicalService.GetMedicationHistoryAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientMedicationHistoryDto>>.SuccessResponse(medications));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving medication history for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve medication history"));
        }
    }

    /// <summary>
    /// Get current medications only
    /// </summary>
    [HttpGet("medications/current")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetCurrentMedications(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var medications = await _clinicalService.GetCurrentMedicationsAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientMedicationHistoryDto>>.SuccessResponse(medications));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current medications for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve current medications"));
        }
    }

    /// <summary>
    /// Add new medication
    /// </summary>
    [HttpPost("medications")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> CreateMedicationHistory(Guid patientId, [FromBody] CreatePatientMedicationHistoryRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var medication = await _clinicalService.CreateMedicationHistoryAsync(patientId, tenantId, request, userId);
            return Ok(ApiResponse<PatientMedicationHistoryDto>.SuccessResponse(medication, "Medication added successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating medication for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to add medication"));
        }
    }

    /// <summary>
    /// Update medication
    /// </summary>
    [HttpPut("medications/{medicationId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdateMedicationHistory(Guid patientId, Guid medicationId, [FromBody] UpdatePatientMedicationHistoryRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var medication = await _clinicalService.UpdateMedicationHistoryAsync(medicationId, tenantId, request, userId);
            return Ok(ApiResponse<PatientMedicationHistoryDto>.SuccessResponse(medication, "Medication updated successfully"));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.ErrorResponse("Medication not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating medication {MedicationId}", medicationId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update medication"));
        }
    }

    /// <summary>
    /// Delete medication
    /// </summary>
    [HttpDelete("medications/{medicationId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteMedicationHistory(Guid patientId, Guid medicationId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _clinicalService.DeleteMedicationHistoryAsync(medicationId, tenantId);
            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Medication not found"));
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Medication deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting medication {MedicationId}", medicationId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to delete medication"));
        }
    }

    // =====================================================
    // IMMUNIZATION ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all immunizations for a patient
    /// </summary>
    [HttpGet("immunizations")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetImmunizations(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var immunizations = await _clinicalService.GetImmunizationsAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientImmunizationDto>>.SuccessResponse(immunizations));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving immunizations for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve immunizations"));
        }
    }

    /// <summary>
    /// Get immunizations due in next 30 days
    /// </summary>
    [HttpGet("immunizations/due")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetDueImmunizations(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var immunizations = await _clinicalService.GetDueImmunizationsAsync(patientId, tenantId);
            return Ok(ApiResponse<List<PatientImmunizationDto>>.SuccessResponse(immunizations));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving due immunizations for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve due immunizations"));
        }
    }

    /// <summary>
    /// Add new immunization record
    /// </summary>
    [HttpPost("immunizations")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> CreateImmunization(Guid patientId, [FromBody] CreatePatientImmunizationRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var immunization = await _clinicalService.CreateImmunizationAsync(patientId, tenantId, request, userId);
            return Ok(ApiResponse<PatientImmunizationDto>.SuccessResponse(immunization, "Immunization record added successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating immunization for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to add immunization record"));
        }
    }

    /// <summary>
    /// Update immunization record
    /// </summary>
    [HttpPut("immunizations/{immunizationId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdateImmunization(Guid patientId, Guid immunizationId, [FromBody] UpdatePatientImmunizationRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var immunization = await _clinicalService.UpdateImmunizationAsync(immunizationId, tenantId, request, userId);
            return Ok(ApiResponse<PatientImmunizationDto>.SuccessResponse(immunization, "Immunization record updated successfully"));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.ErrorResponse("Immunization record not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating immunization {ImmunizationId}", immunizationId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update immunization record"));
        }
    }

    /// <summary>
    /// Delete immunization record
    /// </summary>
    [HttpDelete("immunizations/{immunizationId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteImmunization(Guid patientId, Guid immunizationId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _clinicalService.DeleteImmunizationAsync(immunizationId, tenantId);
            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Immunization record not found"));
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Immunization record deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting immunization {ImmunizationId}", immunizationId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to delete immunization record"));
        }
    }

    // =====================================================
    // DOCUMENT ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all documents for a patient
    /// </summary>
    [HttpGet("documents")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetDocuments(Guid patientId, [FromQuery] string? type = null)
    {
        try
        {
            var tenantId = GetTenantId();
            
            List<PatientDocumentDto> documents;
            if (!string.IsNullOrEmpty(type))
            {
                documents = await _clinicalService.GetDocumentsByTypeAsync(patientId, tenantId, type);
            }
            else
            {
                documents = await _clinicalService.GetDocumentsAsync(patientId, tenantId);
            }
            
            return Ok(ApiResponse<List<PatientDocumentDto>>.SuccessResponse(documents));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving documents for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve documents"));
        }
    }

    /// <summary>
    /// Upload new document
    /// </summary>
    [HttpPost("documents")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UploadDocument(Guid patientId, [FromBody] UploadPatientDocumentRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var document = await _clinicalService.UploadDocumentAsync(patientId, tenantId, request, userId);
            return Ok(ApiResponse<PatientDocumentDto>.SuccessResponse(document, "Document uploaded successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to upload document"));
        }
    }

    /// <summary>
    /// Delete document
    /// </summary>
    [HttpDelete("documents/{documentId}")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> DeleteDocument(Guid patientId, Guid documentId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _clinicalService.DeleteDocumentAsync(documentId, tenantId);
            if (!result)
                return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Document deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to delete document"));
        }
    }

    // =====================================================
    // CLINICAL SUMMARY ENDPOINT
    // =====================================================

    /// <summary>
    /// Get complete clinical summary for a patient
    /// Includes counts and critical allergies
    /// </summary>
    [HttpGet("clinical-summary")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetClinicalSummary(Guid patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var summary = await _clinicalService.GetClinicalSummaryAsync(patientId, tenantId);
            return Ok(ApiResponse<PatientClinicalSummaryDto>.SuccessResponse(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving clinical summary for patient {PatientId}", patientId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve clinical summary"));
        }
    }
}
