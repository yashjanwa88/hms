namespace Shared.EventBus.Interfaces;

public interface IEvent
{
    Guid EventId { get; set; }
    DateTime OccurredAt { get; set; }
    Guid TenantId { get; set; }
}
