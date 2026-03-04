namespace EMRService.Domain;

public class Encounter
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string EncounterNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string EncounterType { get; set; } = string.Empty; // OPD, IPD, Emergency
    public DateTime EncounterDate { get; set; }
    public string Status { get; set; } = "Open"; // Open, Closed
    public string? ChiefComplaint { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class ClinicalNote
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EncounterId { get; set; }
    public string NoteType { get; set; } = "SOAP"; // SOAP, Progress, Discharge
    public string? Subjective { get; set; }
    public string? Objective { get; set; }
    public string? Assessment { get; set; }
    public string? Plan { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class Diagnosis
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EncounterId { get; set; }
    public string ICD10Code { get; set; } = string.Empty;
    public string DiagnosisName { get; set; } = string.Empty;
    public string DiagnosisType { get; set; } = "Secondary"; // Primary, Secondary
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class Vital
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EncounterId { get; set; }
    public decimal? Temperature { get; set; }
    public int? PulseRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public string? BloodPressure { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }
    public decimal? BMI { get; set; }
    public int? OxygenSaturation { get; set; }
    public DateTime RecordedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class Allergy
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string AllergyType { get; set; } = string.Empty; // Drug, Food, Environmental
    public string AllergenName { get; set; } = string.Empty;
    public string Severity { get; set; } = "Mild"; // Mild, Moderate, Severe
    public string? Reaction { get; set; }
    public DateTime? OnsetDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class Procedure
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EncounterId { get; set; }
    public string ProcedureCode { get; set; } = string.Empty;
    public string ProcedureName { get; set; } = string.Empty;
    public DateTime ProcedureDate { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Planned"; // Planned, Completed, Cancelled
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class EMRSequence
{
    public Guid TenantId { get; set; }
    public int Year { get; set; }
    public int LastSequence { get; set; }
}
