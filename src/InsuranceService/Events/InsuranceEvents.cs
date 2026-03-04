using Shared.EventBus.Interfaces;

namespace InsuranceService.Events;

public class PolicyCreatedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public decimal CoverageAmount { get; set; }
}

public class PreAuthApprovedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid PreAuthId { get; set; }
    public string PreAuthNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public decimal ApprovedAmount { get; set; }
}

public class ClaimSubmittedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid ClaimId { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public decimal ClaimAmount { get; set; }
    public string ClaimType { get; set; } = string.Empty;
}

public class ClaimApprovedEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid ClaimId { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public decimal ApprovedAmount { get; set; }
}

public class ClaimSettledEvent : IEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
    public Guid ClaimId { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid SettlementId { get; set; }
    public Guid PatientId { get; set; }
    public decimal SettledAmount { get; set; }
}
