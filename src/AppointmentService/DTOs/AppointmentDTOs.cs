namespace AppointmentService.DTOs;

public class CreateAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string AppointmentType { get; set; } = "New"; // New, Follow-up, Emergency
    public string Reason { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool SendNotification { get; set; } = true;
}

public class RescheduleAppointmentRequest
{
    public DateTime NewAppointmentDate { get; set; }
    public TimeSpan NewStartTime { get; set; }
    public TimeSpan NewEndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CancelAppointmentRequest
{
    public string CancellationReason { get; set; } = string.Empty;
}

public class AppointmentSearchRequest
{
    public Guid? PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public DateTime? AppointmentDate { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "appointment_date";
    public string? SortOrder { get; set; } = "asc";
}

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string AppointmentType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime? CheckInTime { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AvailableSlotRequest
{
    public Guid DoctorId { get; set; }
    public DateTime Date { get; set; }
}

public class AvailableSlotResponse
{
    public DateTime Date { get; set; }
    public List<TimeSlot> AvailableSlots { get; set; } = new();
}

public class TimeSlot
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsAvailable { get; set; }
}

public class DoctorAvailabilityDto
{
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
}

public class PatientDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
}

public class DoctorDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string Department { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; }
    public List<string> Specializations { get; set; } = new();
}

public class DoctorForBookingResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public List<string> Specializations { get; set; } = new();
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; }
}

public class DateValidationResponse
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsPastDate { get; set; }
    public bool IsDoctorAvailable { get; set; }
    public bool HasReachedDailyLimit { get; set; }
    public int CurrentAppointmentCount { get; set; }
    public int MaxAppointmentsAllowed { get; set; }
}

public class BookAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string AppointmentType { get; set; } = "New";
    public string Reason { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool SendNotification { get; set; } = true;
}
