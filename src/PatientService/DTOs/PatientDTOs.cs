namespace PatientService.DTOs;

public class CreatePatientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BloodGroup { get; set; }
    public string? MaritalStatus { get; set; }
    
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
    
    public string? AllergiesSummary { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? DisabilityStatus { get; set; }
    public bool OrganDonor { get; set; }
    
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactMobile { get; set; }
    
    public Guid? InsuranceProviderId { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    public bool ConsentTermsAccepted { get; set; }
    public bool ConsentPrivacyAccepted { get; set; }
    public bool ConsentHealthDataSharing { get; set; }
}

public class UpdatePatientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BloodGroup { get; set; }
    public string? MaritalStatus { get; set; }
    
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
    
    public string? AllergiesSummary { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? DisabilityStatus { get; set; }
    public bool OrganDonor { get; set; }
    
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactMobile { get; set; }
    
    public Guid? InsuranceProviderId { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public string Status { get; set; } = "Active";

    public bool? ConsentTermsAccepted { get; set; }
    public bool? ConsentPrivacyAccepted { get; set; }
    public bool? ConsentHealthDataSharing { get; set; }
}

public class PatientSearchRequest
{
    public string? SearchTerm { get; set; }
    public string? UHID { get; set; }
    public string? MobileNumber { get; set; }
    public string? PolicyNumber { get; set; }
    public string? Status { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "registration_date";
    public string SortOrder { get; set; } = "desc";
}

public class PatientResponse
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName => string.Join(" ", new[] { FirstName, MiddleName, LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string? BloodGroup { get; set; }
    public string? MaritalStatus { get; set; }
    
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    
    public string? AllergiesSummary { get; set; }
    public string? ChronicConditions { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactMobile { get; set; }
    
    public string? PolicyNumber { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    public bool ConsentTermsAccepted { get; set; }
    public bool ConsentPrivacyAccepted { get; set; }
    public bool ConsentHealthDataSharing { get; set; }
    public DateTime? ConsentRecordedAt { get; set; }
    
    public DateTime RegistrationDate { get; set; }
    public string Status { get; set; } = "Active";
    public int VisitCount { get; set; }
}

public class DuplicateCheckResponse
{
    public bool IsDuplicate { get; set; }
    public List<PatientResponse> PotentialDuplicates { get; set; } = new();
}

public class MergePatientRequest
{
    public Guid PrimaryPatientId { get; set; }
    public Guid SecondaryPatientId { get; set; }
}

public class PatientStatsResponse
{
    public int TotalPatients { get; set; }
    public int ActivePatients { get; set; }
    public int InactivePatients { get; set; }
    public int TodayRegistrations { get; set; }
    public int ThisMonthRegistrations { get; set; }
}

public class InsuranceProviderRequest
{
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderCode { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class InsuranceProviderResponse
{
    public Guid Id { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderCode { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
