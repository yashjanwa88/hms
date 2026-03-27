using Shared.Common.Models;

namespace PatientService.Domain;

/// <summary>
/// Patient allergy information for safety alerts
/// </summary>
public class PatientAllergy : BaseEntity
{
    public Guid PatientId { get; set; }
    
    public string AllergenType { get; set; } = string.Empty;  // Drug, Food, Environmental, Other
    public string AllergenName { get; set; } = string.Empty;
    public string? Reaction { get; set; }  // Symptoms/reaction description
    public string Severity { get; set; } = string.Empty;  // Mild, Moderate, Severe, Life-threatening
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Long-term medical conditions requiring ongoing management
/// </summary>
public class PatientChronicCondition : BaseEntity
{
    public Guid PatientId { get; set; }
    
    public string ConditionName { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }  // ICD-10 diagnosis code
    public DateTime? DiagnosedDate { get; set; }
    public string Status { get; set; } = "Active";  // Active, Managed, Resolved, Recurrent
    public string? Notes { get; set; }
}

/// <summary>
/// Patient medication history (current and past)
/// </summary>
public class PatientMedicationHistory : BaseEntity
{
    public Guid PatientId { get; set; }
    
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Dosage { get; set; }  // e.g., "500mg", "5ml"
    public string? Frequency { get; set; }  // e.g., "Twice daily", "Every 8 hours"
    public string? Route { get; set; }  // Oral, IV, IM, Topical, etc.
    
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; } = true;
    
    public string? PrescribedBy { get; set; }  // Doctor name
    public string? Indication { get; set; }  // Reason for medication
    public string? Notes { get; set; }
}

/// <summary>
/// Patient immunization/vaccination records
/// </summary>
public class PatientImmunization : BaseEntity
{
    public Guid PatientId { get; set; }
    
    public string VaccineName { get; set; } = string.Empty;
    public string? VaccineCode { get; set; }  // CVX code (CDC vaccine codes)
    public int? DoseNumber { get; set; }  // 1st dose, 2nd dose, booster, etc.
    public DateTime AdministrationDate { get; set; }
    
    public string? AdministeredBy { get; set; }
    public string? Site { get; set; }  // Left arm, Right arm, Thigh, etc.
    public string? Route { get; set; }  // IM, SC, Oral, Intranasal
    public string? LotNumber { get; set; }
    public string? Manufacturer { get; set; }
    public DateTime? ExpiryDate { get; set; }
    
    public DateTime? NextDoseDueDate { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Patient document attachments (PDFs, images, scans)
/// </summary>
public class PatientDocument : BaseEntity
{
    public Guid PatientId { get; set; }
    
    public string DocumentType { get; set; } = string.Empty;  // ID_Proof, Medical_Record, Consent_Form, Lab_Report, etc.
    public string DocumentName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;  // S3/Azure Blob/local file path
    public int? FileSizeKb { get; set; }
    public string? MimeType { get; set; }  // application/pdf, image/jpeg, etc.
    
    public DateTime UploadedDate { get; set; }
    public string? Description { get; set; }
    public bool IsConfidential { get; set; } = false;
}

/// <summary>
/// Patient clinical summary view model
/// </summary>
public class PatientClinicalSummary
{
    public Guid PatientId { get; set; }
    public Guid TenantId { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string? BloodGroup { get; set; }
    public string? RhFactor { get; set; }
    
    public int AllergyCount { get; set; }
    public int ActiveConditionsCount { get; set; }
    public int CurrentMedicationsCount { get; set; }
    public int ImmunizationCount { get; set; }
    public int DocumentCount { get; set; }
}
