using Shared.EventBus.Interfaces;

namespace PatientService.Events;

public class PatientCreatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class PatientUpdatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
}

public class PatientDeletedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
}
