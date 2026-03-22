namespace DoctorService.DTOs;

public class CreateDoctorRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime? LicenseExpiryDate { get; set; }
    public int ExperienceYears { get; set; }
    public string Department { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; } = 20;
    public string? ProfilePicturePath { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactNumber { get; set; } = string.Empty;
}

public class UpdateDoctorRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime? LicenseExpiryDate { get; set; }
    public int ExperienceYears { get; set; }
    public string Department { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; } = 20;
    public string? ProfilePicturePath { get; set; }
    public bool IsActive { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactNumber { get; set; } = string.Empty;
}

public class DoctorSearchRequest
{
    public string? Search { get; set; }
    public string? SearchTerm { get; set; }
    public string? DoctorCode { get; set; }
    public string? Department { get; set; }
    public string? Specialization { get; set; }
    public string? Status { get; set; }
    public bool? IsActive { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "created_at";
    public string? SortOrder { get; set; } = "desc";
}

public class DoctorResponse
{
    public Guid Id { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {MiddleName} {LastName}".Trim();
    public DateTime DateOfBirth { get; set; }
    public int Age => DateTime.UtcNow.Year - DateOfBirth.Year;
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string Department { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; }
    public string? ProfilePicturePath { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AddSpecializationRequest
{
    public string SpecializationName { get; set; } = string.Empty;
    public string CertificationBody { get; set; } = string.Empty;
    public DateTime? CertificationDate { get; set; }
    public bool IsPrimary { get; set; }
}

public class AddQualificationRequest
{
    public string DegreeName { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public int YearOfCompletion { get; set; }
    public string Country { get; set; } = string.Empty;
}

public class AddAvailabilityRequest
{
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } = 15;
}

public class AddLeaveRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string LeaveType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class AvailabilityResponse
{
    public Guid Id { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public bool IsAvailable { get; set; }
}
