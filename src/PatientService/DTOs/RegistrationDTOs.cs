using System.ComponentModel.DataAnnotations;

namespace PatientService.DTOs;

// =====================================================
// REGISTRATION DTOs
// =====================================================

public class RegisterPatientRequest
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? MiddleName { get; set; }

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Gender is required")]
    [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Invalid gender")]
    public string Gender { get; set; } = string.Empty;

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime DateOfBirth { get; set; }

    [RegularExpression("^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$", ErrorMessage = "Invalid blood group")]
    public string? BloodGroup { get; set; }

    [RegularExpression("^(Single|Married|Divorced|Widowed)$")]
    public string? MaritalStatus { get; set; }

    [Required(ErrorMessage = "Mobile number is required")]
    [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Invalid mobile number")]
    public string MobileNumber { get; set; } = string.Empty;

    [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Invalid alternate mobile")]
    public string? AlternateMobile { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string? Email { get; set; }

    [RegularExpression(@"^[6-9]\d{9}$")]
    public string? WhatsAppNumber { get; set; }

    [StringLength(255)]
    public string? AddressLine1 { get; set; }

    [StringLength(255)]
    public string? AddressLine2 { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? State { get; set; }

    [RegularExpression(@"^\d{6}$", ErrorMessage = "Invalid pincode")]
    public string? Pincode { get; set; }

    [StringLength(100)]
    public string? Country { get; set; } = "India";

    public string? AllergiesSummary { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? DisabilityStatus { get; set; }
    public bool OrganDonor { get; set; }

    [StringLength(200)]
    public string? EmergencyContactName { get; set; }

    [StringLength(50)]
    public string? EmergencyContactRelation { get; set; }

    [RegularExpression(@"^[6-9]\d{9}$")]
    public string? EmergencyContactMobile { get; set; }

    public Guid? InsuranceProviderId { get; set; }
    
    [StringLength(100)]
    public string? PolicyNumber { get; set; }
    
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

public class PatientRegistrationResponse
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<DuplicatePatientInfo>? PotentialDuplicates { get; set; }
}

public class DuplicatePatientInfo
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string MatchReason { get; set; } = string.Empty;
    public int MatchScore { get; set; }
}

public class CheckDuplicateRequest
{
    [Required]
    [RegularExpression(@"^[6-9]\d{9}$")]
    public string MobileNumber { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public DateTime DateOfBirth { get; set; }
}

public class QuickSearchRequest
{
    [Required]
    [MinLength(3, ErrorMessage = "Search term must be at least 3 characters")]
    public string SearchTerm { get; set; } = string.Empty;

    public int MaxResults { get; set; } = 10;
}

public class QuickSearchResponse
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
}
