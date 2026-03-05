namespace VisitService.DTOs;

public class CreateVisitRequest
{
    public Guid PatientId { get; set; }
    public string PatientUHID { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public string? ChiefComplaint { get; set; }
    public string? Symptoms { get; set; }
    public bool IsEmergency { get; set; }
    public decimal? ConsultationFee { get; set; }
}

public class UpdateVisitRequest
{
    public string? ChiefComplaint { get; set; }
    public string? Symptoms { get; set; }
    public string? VitalSigns { get; set; }
    public string? Diagnosis { get; set; }
    public string? Treatment { get; set; }
    public string? Prescription { get; set; }
    public string? Instructions { get; set; }
    public string? FollowUpDate { get; set; }
    public string? Notes { get; set; }
}

public class VisitResponse
{
    public Guid Id { get; set; }
    public string VisitNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientUHID { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime VisitDateTime { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Symptoms { get; set; }
    public string? VitalSigns { get; set; }
    public string? Diagnosis { get; set; }
    public string? Treatment { get; set; }
    public string? Prescription { get; set; }
    public string? Instructions { get; set; }
    public string? FollowUpDate { get; set; }
    public bool IsEmergency { get; set; }
    public bool IsIPDConverted { get; set; }
    public Guid? IPDAdmissionId { get; set; }
    public decimal? ConsultationFee { get; set; }
    public string? PaymentStatus { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VisitSearchRequest
{
    public string? VisitNumber { get; set; }
    public string? PatientUHID { get; set; }
    public Guid? PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public string? Department { get; set; }
    public string? VisitType { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool? IsEmergency { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "visit_date_time";
    public string SortOrder { get; set; } = "desc";
}

public class EmergencyVisitRequest
{
    public Guid PatientId { get; set; }
    public string PatientUHID { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string ChiefComplaint { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
    public string Priority { get; set; } = "Emergency";
    public string? VitalSigns { get; set; }
}

public class IPDConversionRequest
{
    public Guid VisitId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? WardType { get; set; }
    public string? RoomNumber { get; set; }
    public DateTime? AdmissionDateTime { get; set; }
}

public class VisitTimelineResponse
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventDescription { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public string? PerformedByName { get; set; }
    public string? EventData { get; set; }
}

public class VisitStatsResponse
{
    public int TotalVisits { get; set; }
    public int TodayVisits { get; set; }
    public int ActiveVisits { get; set; }
    public int EmergencyVisits { get; set; }
    public int IPDConversions { get; set; }
    public int CompletedVisits { get; set; }
}