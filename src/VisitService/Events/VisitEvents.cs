using Shared.EventBus.Interfaces;

namespace VisitService.Events;

public class VisitCreatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string VisitType { get; set; } = string.Empty;
    public string VisitNumber { get; set; } = string.Empty;
    public DateTime VisitDateTime { get; set; }
    public bool IsEmergency { get; set; }
}

public class VisitCompletedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class VisitConvertedToIPDEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public Guid IPDAdmissionId { get; set; }
    public DateTime ConvertedAt { get; set; }
}