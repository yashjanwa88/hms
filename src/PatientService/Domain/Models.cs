using Shared.Common.Models;

namespace PatientService.Domain;

public class Patient : BaseEntity
{
    public string UHID { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age => DateTime.UtcNow.Year - DateOfBirth.Year - (DateTime.UtcNow.DayOfYear < DateOfBirth.DayOfYear ? 1 : 0);
    public string? BloodGroup { get; set; }
    public string? MaritalStatus { get; set; }
    
    // Contact
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Country { get; set; }
    
    // Medical Basic
    public string? AllergiesSummary { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? DisabilityStatus { get; set; }
    public bool OrganDonor { get; set; }
    
    // Emergency Contact
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactMobile { get; set; }
    
    // Insurance Link
    public Guid? InsuranceProviderId { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    
    // System
    public DateTime RegistrationDate { get; set; }
    public Guid? RegisteredBy { get; set; }
    public string Status { get; set; } = "Active";
    public int VisitCount { get; set; }
}







public class PatientInsurance : BaseEntity
{
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderCode { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class PatientSequence : BaseEntity
{
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
}

public class PatientSearchIndex : BaseEntity
{
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string? BloodGroup { get; set; }
    public string? City { get; set; }
    public string? Pincode { get; set; }
    public string SearchText { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

public class PatientVisit : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid? BranchId { get; set; }
    public string VisitNumber { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty; // OPD, IPD, Emergency
    public DateTime VisitDate { get; set; }
    public Guid? DoctorId { get; set; }
    public string? Department { get; set; }
    public string? ChiefComplaint { get; set; }
    public string Status { get; set; } = "Active"; // Active, Closed, Cancelled
    public DateTime? ClosedAt { get; set; }
    public Guid? ClosedBy { get; set; }
}

public class VisitVitals : BaseEntity
{
    public Guid VisitId { get; set; }
    public DateTime RecordedAt { get; set; }
    public decimal? Temperature { get; set; }
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? PulseRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public decimal? OxygenSaturation { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public decimal? BMI { get; set; }
    public string? Notes { get; set; }
    public Guid? RecordedBy { get; set; }
}

public class VisitDiagnosis : BaseEntity
{
    public Guid VisitId { get; set; }
    public string? DiagnosisCode { get; set; }
    public string DiagnosisName { get; set; } = string.Empty;
    public string DiagnosisType { get; set; } = string.Empty; // Primary, Secondary, Differential
    public string? Severity { get; set; }
    public string? Notes { get; set; }
    public Guid? DiagnosedBy { get; set; }
    public DateTime DiagnosedAt { get; set; }
}
