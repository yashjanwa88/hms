using Shared.Common.Models;

namespace DoctorService.Domain;

public class Doctor : BaseEntity
{
    public string DoctorCode { get; set; } = string.Empty;
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
    public bool IsActive { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactNumber { get; set; } = string.Empty;
}

public class DoctorSpecialization : BaseEntity
{
    public Guid DoctorId { get; set; }
    public string SpecializationName { get; set; } = string.Empty;
    public string CertificationBody { get; set; } = string.Empty;
    public DateTime? CertificationDate { get; set; }
    public bool IsPrimary { get; set; }
}

public class DoctorQualification : BaseEntity
{
    public Guid DoctorId { get; set; }
    public string DegreeName { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public int YearOfCompletion { get; set; }
    public string Country { get; set; } = string.Empty;
}

public class DoctorAvailability : BaseEntity
{
    public Guid DoctorId { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public bool IsAvailable { get; set; }
}

public class DoctorLeave : BaseEntity
{
    public Guid DoctorId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string LeaveType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}
