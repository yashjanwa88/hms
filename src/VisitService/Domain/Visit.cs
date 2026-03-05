using Shared.Common.Models;

namespace VisitService.Domain;

public class Visit : BaseEntity
{
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
}

public class VisitTimeline : BaseEntity
{
    public Guid VisitId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventDescription { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public Guid? PerformedBy { get; set; }
    public string? PerformedByName { get; set; }
    public string? EventData { get; set; }
}