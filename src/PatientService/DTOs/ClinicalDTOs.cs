namespace PatientService.DTOs;

// =====================================================
// ALLERGY DTOs
// =====================================================

public class PatientAllergyDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string AllergenType { get; set; } = string.Empty;  // Drug, Food, Environmental, Other
    public string AllergenName { get; set; } = string.Empty;
    public string? Reaction { get; set; }
    public string Severity { get; set; } = string.Empty;  // Mild, Moderate, Severe, Life-threatening
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientAllergyRequest
{
    public string AllergenType { get; set; } = string.Empty;
    public string AllergenName { get; set; } = string.Empty;
    public string? Reaction { get; set; }
    public string Severity { get; set; } = string.Empty;
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePatientAllergyRequest
{
    public string AllergenType { get; set; } = string.Empty;
    public string AllergenName { get; set; } = string.Empty;
    public string? Reaction { get; set; }
    public string Severity { get; set; } = string.Empty;
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
}

// =====================================================
// CHRONIC CONDITION DTOs
// =====================================================

public class PatientChronicConditionDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string ConditionName { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime? DiagnosedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientChronicConditionRequest
{
    public string ConditionName { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime? DiagnosedDate { get; set; }
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
}

public class UpdatePatientChronicConditionRequest
{
    public string ConditionName { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime? DiagnosedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// =====================================================
// MEDICATION HISTORY DTOs
// =====================================================

public class PatientMedicationHistoryDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Route { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? PrescribedBy { get; set; }
    public string? Indication { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientMedicationHistoryRequest
{
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Route { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; } = true;
    public string? PrescribedBy { get; set; }
    public string? Indication { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePatientMedicationHistoryRequest
{
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Route { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? PrescribedBy { get; set; }
    public string? Indication { get; set; }
    public string? Notes { get; set; }
}

// =====================================================
// IMMUNIZATION DTOs
// =====================================================

public class PatientImmunizationDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string VaccineName { get; set; } = string.Empty;
    public string? VaccineCode { get; set; }
    public int? DoseNumber { get; set; }
    public DateTime AdministrationDate { get; set; }
    public string? AdministeredBy { get; set; }
    public string? Site { get; set; }
    public string? Route { get; set; }
    public string? LotNumber { get; set; }
    public string? Manufacturer { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? NextDoseDueDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientImmunizationRequest
{
    public string VaccineName { get; set; } = string.Empty;
    public string? VaccineCode { get; set; }
    public int? DoseNumber { get; set; }
    public DateTime AdministrationDate { get; set; }
    public string? AdministeredBy { get; set; }
    public string? Site { get; set; }
    public string? Route { get; set; }
    public string? LotNumber { get; set; }
    public string? Manufacturer { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? NextDoseDueDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePatientImmunizationRequest
{
    public string VaccineName { get; set; } = string.Empty;
    public string? VaccineCode { get; set; }
    public int? DoseNumber { get; set; }
    public DateTime AdministrationDate { get; set; }
    public string? AdministeredBy { get; set; }
    public string? Site { get; set; }
    public string? Route { get; set; }
    public string? LotNumber { get; set; }
    public string? Manufacturer { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? NextDoseDueDate { get; set; }
    public string? Notes { get; set; }
}

// =====================================================
// DOCUMENT DTOs
// =====================================================

public class PatientDocumentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int? FileSizeKb { get; set; }
    public string? MimeType { get; set; }
    public DateTime UploadedDate { get; set; }
    public string? Description { get; set; }
    public bool IsConfidential { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UploadPatientDocumentRequest
{
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;  // Will be generated by upload service
    public int? FileSizeKb { get; set; }
    public string? MimeType { get; set; }
    public string? Description { get; set; }
    public bool IsConfidential { get; set; } = false;
}

// =====================================================
// CLINICAL SUMMARY DTOs
// =====================================================

public class PatientClinicalSummaryDto
{
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string? BloodGroup { get; set; }
    public string? RhFactor { get; set; }
    
    public int AllergyCount { get; set; }
    public int ActiveConditionsCount { get; set; }
    public int CurrentMedicationsCount { get; set; }
    public int ImmunizationCount { get; set; }
    public int DocumentCount { get; set; }
    
    public List<PatientAllergyDto>? CriticalAllergies { get; set; }  // Severe/Life-threatening only
}
