using Shared.EventBus.Interfaces;

namespace DoctorService.Events;

public class DoctorCreatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class DoctorUpdatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
}

public class DoctorDeletedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
}

public class DoctorAvailabilityUpdatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
}
