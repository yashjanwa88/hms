using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;

namespace PatientService.Application;

// =====================================================
// PATIENT CLINICAL SERVICE
// =====================================================

public interface IPatientClinicalService
{
    // Allergies
    Task<List<PatientAllergyDto>> GetAllergiesAsync(Guid patientId, Guid tenantId);
    Task<List<PatientAllergyDto>> GetCriticalAllergiesAsync(Guid patientId, Guid tenantId);
    Task<PatientAllergyDto> CreateAllergyAsync(Guid patientId, Guid tenantId, CreatePatientAllergyRequest request, Guid? createdBy);
    Task<PatientAllergyDto> UpdateAllergyAsync(Guid id, Guid tenantId, UpdatePatientAllergyRequest request, Guid? updatedBy);
    Task<bool> DeleteAllergyAsync(Guid id, Guid tenantId);

    // Chronic Conditions
    Task<List<PatientChronicConditionDto>> GetChronicConditionsAsync(Guid patientId, Guid tenantId);
    Task<List<PatientChronicConditionDto>> GetActiveConditionsAsync(Guid patientId, Guid tenantId);
    Task<PatientChronicConditionDto> CreateChronicConditionAsync(Guid patientId, Guid tenantId, CreatePatientChronicConditionRequest request, Guid? createdBy);
    Task<PatientChronicConditionDto> UpdateChronicConditionAsync(Guid id, Guid tenantId, UpdatePatientChronicConditionRequest request, Guid? updatedBy);
    Task<bool> DeleteChronicConditionAsync(Guid id, Guid tenantId);

    // Medication History
    Task<List<PatientMedicationHistoryDto>> GetMedicationHistoryAsync(Guid patientId, Guid tenantId);
    Task<List<PatientMedicationHistoryDto>> GetCurrentMedicationsAsync(Guid patientId, Guid tenantId);
    Task<PatientMedicationHistoryDto> CreateMedicationHistoryAsync(Guid patientId, Guid tenantId, CreatePatientMedicationHistoryRequest request, Guid? createdBy);
    Task<PatientMedicationHistoryDto> UpdateMedicationHistoryAsync(Guid id, Guid tenantId, UpdatePatientMedicationHistoryRequest request, Guid? updatedBy);
    Task<bool> DeleteMedicationHistoryAsync(Guid id, Guid tenantId);

    // Immunizations
    Task<List<PatientImmunizationDto>> GetImmunizationsAsync(Guid patientId, Guid tenantId);
    Task<List<PatientImmunizationDto>> GetDueImmunizationsAsync(Guid patientId, Guid tenantId);
    Task<PatientImmunizationDto> CreateImmunizationAsync(Guid patientId, Guid tenantId, CreatePatientImmunizationRequest request, Guid? createdBy);
    Task<PatientImmunizationDto> UpdateImmunizationAsync(Guid id, Guid tenantId, UpdatePatientImmunizationRequest request, Guid? updatedBy);
    Task<bool> DeleteImmunizationAsync(Guid id, Guid tenantId);

    // Documents
    Task<List<PatientDocumentDto>> GetDocumentsAsync(Guid patientId, Guid tenantId);
    Task<List<PatientDocumentDto>> GetDocumentsByTypeAsync(Guid patientId, Guid tenantId, string documentType);
    Task<PatientDocumentDto> UploadDocumentAsync(Guid patientId, Guid tenantId, UploadPatientDocumentRequest request, Guid? createdBy);
    Task<bool> DeleteDocumentAsync(Guid id, Guid tenantId);

    // Clinical Summary
    Task<PatientClinicalSummaryDto> GetClinicalSummaryAsync(Guid patientId, Guid tenantId);
}

public class PatientClinicalService : IPatientClinicalService
{
    private readonly IPatientAllergyRepository _allergyRepository;
    private readonly IPatientChronicConditionRepository _conditionRepository;
    private readonly IPatientMedicationHistoryRepository _medicationRepository;
    private readonly IPatientImmunizationRepository _immunizationRepository;
    private readonly IPatientDocumentRepository _documentRepository;

    public PatientClinicalService(
        IPatientAllergyRepository allergyRepository,
        IPatientChronicConditionRepository conditionRepository,
        IPatientMedicationHistoryRepository medicationRepository,
        IPatientImmunizationRepository immunizationRepository,
        IPatientDocumentRepository documentRepository)
    {
        _allergyRepository = allergyRepository;
        _conditionRepository = conditionRepository;
        _medicationRepository = medicationRepository;
        _immunizationRepository = immunizationRepository;
        _documentRepository = documentRepository;
    }

    // =====================================================
    // ALLERGIES
    // =====================================================

    public async Task<List<PatientAllergyDto>> GetAllergiesAsync(Guid patientId, Guid tenantId)
    {
        var allergies = await _allergyRepository.GetByPatientIdAsync(patientId, tenantId);
        return allergies.Select(MapToAllergyDto).ToList();
    }

    public async Task<List<PatientAllergyDto>> GetCriticalAllergiesAsync(Guid patientId, Guid tenantId)
    {
        var allergies = await _allergyRepository.GetCriticalAllergiesAsync(patientId, tenantId);
        return allergies.Select(MapToAllergyDto).ToList();
    }

    public async Task<PatientAllergyDto> CreateAllergyAsync(Guid patientId, Guid tenantId, CreatePatientAllergyRequest request, Guid? createdBy)
    {
        var allergy = new PatientAllergy
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            AllergenType = request.AllergenType,
            AllergenName = request.AllergenName,
            Reaction = request.Reaction,
            Severity = request.Severity,
            OnsetDate = request.OnsetDate,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        await _allergyRepository.CreateAsync(allergy);
        return MapToAllergyDto(allergy);
    }

    public async Task<PatientAllergyDto> UpdateAllergyAsync(Guid id, Guid tenantId, UpdatePatientAllergyRequest request, Guid? updatedBy)
    {
        var existing = await _allergyRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            throw new KeyNotFoundException($"Allergy with ID {id} not found");

        existing.AllergenType = request.AllergenType;
        existing.AllergenName = request.AllergenName;
        existing.Reaction = request.Reaction;
        existing.Severity = request.Severity;
        existing.OnsetDate = request.OnsetDate;
        existing.Notes = request.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = updatedBy;

        await _allergyRepository.UpdateAsync(existing);
        return MapToAllergyDto(existing);
    }

    public async Task<bool> DeleteAllergyAsync(Guid id, Guid tenantId)
    {
        return await _allergyRepository.DeleteAsync(id, tenantId);
    }

    // =====================================================
    // CHRONIC CONDITIONS
    // =====================================================

    public async Task<List<PatientChronicConditionDto>> GetChronicConditionsAsync(Guid patientId, Guid tenantId)
    {
        var conditions = await _conditionRepository.GetByPatientIdAsync(patientId, tenantId);
        return conditions.Select(MapToConditionDto).ToList();
    }

    public async Task<List<PatientChronicConditionDto>> GetActiveConditionsAsync(Guid patientId, Guid tenantId)
    {
        var conditions = await _conditionRepository.GetActiveConditionsAsync(patientId, tenantId);
        return conditions.Select(MapToConditionDto).ToList();
    }

    public async Task<PatientChronicConditionDto> CreateChronicConditionAsync(Guid patientId, Guid tenantId, CreatePatientChronicConditionRequest request, Guid? createdBy)
    {
        var condition = new PatientChronicCondition
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            ConditionName = request.ConditionName,
            Icd10Code = request.Icd10Code,
            DiagnosedDate = request.DiagnosedDate,
            Status = request.Status,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        await _conditionRepository.CreateAsync(condition);
        return MapToConditionDto(condition);
    }

    public async Task<PatientChronicConditionDto> UpdateChronicConditionAsync(Guid id, Guid tenantId, UpdatePatientChronicConditionRequest request, Guid? updatedBy)
    {
        var existing = await _conditionRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            throw new KeyNotFoundException($"Chronic condition with ID {id} not found");

        existing.ConditionName = request.ConditionName;
        existing.Icd10Code = request.Icd10Code;
        existing.DiagnosedDate = request.DiagnosedDate;
        existing.Status = request.Status;
        existing.Notes = request.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = updatedBy;

        await _conditionRepository.UpdateAsync(existing);
        return MapToConditionDto(existing);
    }

    public async Task<bool> DeleteChronicConditionAsync(Guid id, Guid tenantId)
    {
        return await _conditionRepository.DeleteAsync(id, tenantId);
    }

    // =====================================================
    // MEDICATION HISTORY
    // =====================================================

    public async Task<List<PatientMedicationHistoryDto>> GetMedicationHistoryAsync(Guid patientId, Guid tenantId)
    {
        var medications = await _medicationRepository.GetByPatientIdAsync(patientId, tenantId);
        return medications.Select(MapToMedicationDto).ToList();
    }

    public async Task<List<PatientMedicationHistoryDto>> GetCurrentMedicationsAsync(Guid patientId, Guid tenantId)
    {
        var medications = await _medicationRepository.GetCurrentMedicationsAsync(patientId, tenantId);
        return medications.Select(MapToMedicationDto).ToList();
    }

    public async Task<PatientMedicationHistoryDto> CreateMedicationHistoryAsync(Guid patientId, Guid tenantId, CreatePatientMedicationHistoryRequest request, Guid? createdBy)
    {
        var medication = new PatientMedicationHistory
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            MedicationName = request.MedicationName,
            GenericName = request.GenericName,
            Dosage = request.Dosage,
            Frequency = request.Frequency,
            Route = request.Route,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsCurrent = request.IsCurrent,
            PrescribedBy = request.PrescribedBy,
            Indication = request.Indication,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        await _medicationRepository.CreateAsync(medication);
        return MapToMedicationDto(medication);
    }

    public async Task<PatientMedicationHistoryDto> UpdateMedicationHistoryAsync(Guid id, Guid tenantId, UpdatePatientMedicationHistoryRequest request, Guid? updatedBy)
    {
        var existing = await _medicationRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            throw new KeyNotFoundException($"Medication history with ID {id} not found");

        existing.MedicationName = request.MedicationName;
        existing.GenericName = request.GenericName;
        existing.Dosage = request.Dosage;
        existing.Frequency = request.Frequency;
        existing.Route = request.Route;
        existing.StartDate = request.StartDate;
        existing.EndDate = request.EndDate;
        existing.IsCurrent = request.IsCurrent;
        existing.PrescribedBy = request.PrescribedBy;
        existing.Indication = request.Indication;
        existing.Notes = request.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = updatedBy;

        await _medicationRepository.UpdateAsync(existing);
        return MapToMedicationDto(existing);
    }

    public async Task<bool> DeleteMedicationHistoryAsync(Guid id, Guid tenantId)
    {
        return await _medicationRepository.DeleteAsync(id, tenantId);
    }

    // =====================================================
    // IMMUNIZATIONS
    // =====================================================

    public async Task<List<PatientImmunizationDto>> GetImmunizationsAsync(Guid patientId, Guid tenantId)
    {
        var immunizations = await _immunizationRepository.GetByPatientIdAsync(patientId, tenantId);
        return immunizations.Select(MapToImmunizationDto).ToList();
    }

    public async Task<List<PatientImmunizationDto>> GetDueImmunizationsAsync(Guid patientId, Guid tenantId)
    {
        var immunizations = await _immunizationRepository.GetDueImmunizationsAsync(patientId, tenantId);
        return immunizations.Select(MapToImmunizationDto).ToList();
    }

    public async Task<PatientImmunizationDto> CreateImmunizationAsync(Guid patientId, Guid tenantId, CreatePatientImmunizationRequest request, Guid? createdBy)
    {
        var immunization = new PatientImmunization
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            VaccineName = request.VaccineName,
            VaccineCode = request.VaccineCode,
            DoseNumber = request.DoseNumber,
            AdministrationDate = request.AdministrationDate,
            AdministeredBy = request.AdministeredBy,
            Site = request.Site,
            Route = request.Route,
            LotNumber = request.LotNumber,
            Manufacturer = request.Manufacturer,
            ExpiryDate = request.ExpiryDate,
            NextDoseDueDate = request.NextDoseDueDate,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        await _immunizationRepository.CreateAsync(immunization);
        return MapToImmunizationDto(immunization);
    }

    public async Task<PatientImmunizationDto> UpdateImmunizationAsync(Guid id, Guid tenantId, UpdatePatientImmunizationRequest request, Guid? updatedBy)
    {
        var existing = await _immunizationRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            throw new KeyNotFoundException($"Immunization with ID {id} not found");

        existing.VaccineName = request.VaccineName;
        existing.VaccineCode = request.VaccineCode;
        existing.DoseNumber = request.DoseNumber;
        existing.AdministrationDate = request.AdministrationDate;
        existing.AdministeredBy = request.AdministeredBy;
        existing.Site = request.Site;
        existing.Route = request.Route;
        existing.LotNumber = request.LotNumber;
        existing.Manufacturer = request.Manufacturer;
        existing.ExpiryDate = request.ExpiryDate;
        existing.NextDoseDueDate = request.NextDoseDueDate;
        existing.Notes = request.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = updatedBy;

        await _immunizationRepository.UpdateAsync(existing);
        return MapToImmunizationDto(existing);
    }

    public async Task<bool> DeleteImmunizationAsync(Guid id, Guid tenantId)
    {
        return await _immunizationRepository.DeleteAsync(id, tenantId);
    }

    // =====================================================
    // DOCUMENTS
    // =====================================================

    public async Task<List<PatientDocumentDto>> GetDocumentsAsync(Guid patientId, Guid tenantId)
    {
        var documents = await _documentRepository.GetByPatientIdAsync(patientId, tenantId);
        return documents.Select(MapToDocumentDto).ToList();
    }

    public async Task<List<PatientDocumentDto>> GetDocumentsByTypeAsync(Guid patientId, Guid tenantId, string documentType)
    {
        var documents = await _documentRepository.GetByTypeAsync(patientId, tenantId, documentType);
        return documents.Select(MapToDocumentDto).ToList();
    }

    public async Task<PatientDocumentDto> UploadDocumentAsync(Guid patientId, Guid tenantId, UploadPatientDocumentRequest request, Guid? createdBy)
    {
        var document = new PatientDocument
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            DocumentType = request.DocumentType,
            DocumentName = request.DocumentName,
            FilePath = request.FilePath,
            FileSizeKb = request.FileSizeKb,
            MimeType = request.MimeType,
            UploadedDate = DateTime.UtcNow.Date,
            Description = request.Description,
            IsConfidential = request.IsConfidential,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        await _documentRepository.CreateAsync(document);
        return MapToDocumentDto(document);
    }

    public async Task<bool> DeleteDocumentAsync(Guid id, Guid tenantId)
    {
        return await _documentRepository.DeleteAsync(id, tenantId);
    }

    // =====================================================
    // CLINICAL SUMMARY
    // =====================================================

    public async Task<PatientClinicalSummaryDto> GetClinicalSummaryAsync(Guid patientId, Guid tenantId)
    {
        var allergies = await _allergyRepository.GetByPatientIdAsync(patientId, tenantId);
        var criticalAllergies = await _allergyRepository.GetCriticalAllergiesAsync(patientId, tenantId);
        var conditions = await _conditionRepository.GetActiveConditionsAsync(patientId, tenantId);
        var medications = await _medicationRepository.GetCurrentMedicationsAsync(patientId, tenantId);
        var immunizations = await _immunizationRepository.GetByPatientIdAsync(patientId, tenantId);
        var documents = await _documentRepository.GetByPatientIdAsync(patientId, tenantId);

        return new PatientClinicalSummaryDto
        {
            PatientId = patientId,
            AllergyCount = allergies.Count,
            ActiveConditionsCount = conditions.Count,
            CurrentMedicationsCount = medications.Count,
            ImmunizationCount = immunizations.Count,
            DocumentCount = documents.Count,
            CriticalAllergies = criticalAllergies.Select(MapToAllergyDto).ToList()
        };
    }

    // =====================================================
    // MAPPING HELPERS
    // =====================================================

    private static PatientAllergyDto MapToAllergyDto(PatientAllergy allergy) => new()
    {
        Id = allergy.Id,
        PatientId = allergy.PatientId,
        AllergenType = allergy.AllergenType,
        AllergenName = allergy.AllergenName,
        Reaction = allergy.Reaction,
        Severity = allergy.Severity,
        OnsetDate = allergy.OnsetDate,
        Notes = allergy.Notes,
        CreatedAt = allergy.CreatedAt
    };

    private static PatientChronicConditionDto MapToConditionDto(PatientChronicCondition condition) => new()
    {
        Id = condition.Id,
        PatientId = condition.PatientId,
        ConditionName = condition.ConditionName,
        Icd10Code = condition.Icd10Code,
        DiagnosedDate = condition.DiagnosedDate,
        Status = condition.Status,
        Notes = condition.Notes,
        CreatedAt = condition.CreatedAt
    };

    private static PatientMedicationHistoryDto MapToMedicationDto(PatientMedicationHistory medication) => new()
    {
        Id = medication.Id,
        PatientId = medication.PatientId,
        MedicationName = medication.MedicationName,
        GenericName = medication.GenericName,
        Dosage = medication.Dosage,
        Frequency = medication.Frequency,
        Route = medication.Route,
        StartDate = medication.StartDate,
        EndDate = medication.EndDate,
        IsCurrent = medication.IsCurrent,
        PrescribedBy = medication.PrescribedBy,
        Indication = medication.Indication,
        Notes = medication.Notes,
        CreatedAt = medication.CreatedAt
    };

    private static PatientImmunizationDto MapToImmunizationDto(PatientImmunization immunization) => new()
    {
        Id = immunization.Id,
        PatientId = immunization.PatientId,
        VaccineName = immunization.VaccineName,
        VaccineCode = immunization.VaccineCode,
        DoseNumber = immunization.DoseNumber,
        AdministrationDate = immunization.AdministrationDate,
        AdministeredBy = immunization.AdministeredBy,
        Site = immunization.Site,
        Route = immunization.Route,
        LotNumber = immunization.LotNumber,
        Manufacturer = immunization.Manufacturer,
        ExpiryDate = immunization.ExpiryDate,
        NextDoseDueDate = immunization.NextDoseDueDate,
        Notes = immunization.Notes,
        CreatedAt = immunization.CreatedAt
    };

    private static PatientDocumentDto MapToDocumentDto(PatientDocument document) => new()
    {
        Id = document.Id,
        PatientId = document.PatientId,
        DocumentType = document.DocumentType,
        DocumentName = document.DocumentName,
        FilePath = document.FilePath,
        FileSizeKb = document.FileSizeKb,
        MimeType = document.MimeType,
        UploadedDate = document.UploadedDate,
        Description = document.Description,
        IsConfidential = document.IsConfidential,
        CreatedAt = document.CreatedAt
    };
}
