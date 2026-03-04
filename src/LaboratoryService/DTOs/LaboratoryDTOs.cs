using Shared.EventBus.Interfaces;

namespace LaboratoryService.DTOs;

// Lab Test DTOs
public class CreateLabTestRequest
{
    public string TestCode { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TurnaroundTimeHours { get; set; }
    public string? SampleType { get; set; }
    public List<CreateLabTestParameterRequest> Parameters { get; set; } = new();
}

public class CreateLabTestParameterRequest
{
    public string ParameterName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal? ReferenceMin { get; set; }
    public decimal? ReferenceMax { get; set; }
    public decimal? CriticalMin { get; set; }
    public decimal? CriticalMax { get; set; }
    public string? ReferenceRange { get; set; }
    public int DisplayOrder { get; set; }
}

public class LabTestResponse
{
    public Guid Id { get; set; }
    public string TestCode { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TurnaroundTimeHours { get; set; }
    public string? SampleType { get; set; }
    public bool IsActive { get; set; }
    public List<LabTestParameterResponse> Parameters { get; set; } = new();
}

public class LabTestParameterResponse
{
    public Guid Id { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal? ReferenceMin { get; set; }
    public decimal? ReferenceMax { get; set; }
    public decimal? CriticalMin { get; set; }
    public decimal? CriticalMax { get; set; }
    public string? ReferenceRange { get; set; }
    public int DisplayOrder { get; set; }
}

// Lab Order DTOs
public class CreateLabOrderRequest
{
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public string Priority { get; set; } = "Routine";
    public string? ClinicalNotes { get; set; }
    public List<Guid> LabTestIds { get; set; } = new();
}

public class LabOrderResponse
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? SampleCollectedAt { get; set; }
    public string? SampleCollectedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public string? ClinicalNotes { get; set; }
    public string? CancellationReason { get; set; }
    public List<LabOrderItemResponse> Items { get; set; } = new();
}

public class LabOrderItemResponse
{
    public Guid Id { get; set; }
    public Guid LabTestId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ResultEnteredAt { get; set; }
    public string? ResultEnteredBy { get; set; }
    public List<LabResultResponse> Results { get; set; } = new();
}

public class LabResultResponse
{
    public Guid Id { get; set; }
    public Guid LabTestParameterId { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string? Value { get; set; }
    public bool IsAbnormal { get; set; }
    public bool IsCritical { get; set; }
    public string? Comments { get; set; }
    public decimal? ReferenceMin { get; set; }
    public decimal? ReferenceMax { get; set; }
    public string? ReferenceRange { get; set; }
}

public class CollectSampleRequest
{
    public string? Notes { get; set; }
}

public class CancelLabOrderRequest
{
    public string CancellationReason { get; set; } = string.Empty;
}

public class EnterLabResultsRequest
{
    public List<LabResultEntryRequest> Results { get; set; } = new();
}

public class LabResultEntryRequest
{
    public Guid LabTestParameterId { get; set; }
    public string? Value { get; set; }
    public string? Comments { get; set; }
}

public class LabReportResponse
{
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string Priority { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string? ClinicalNotes { get; set; }
    public List<LabReportTestResponse> Tests { get; set; } = new();
}

public class LabReportTestResponse
{
    public string TestName { get; set; } = string.Empty;
    public string? SampleType { get; set; }
    public List<LabReportParameterResponse> Parameters { get; set; } = new();
}

public class LabReportParameterResponse
{
    public string ParameterName { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ReferenceRange { get; set; }
    public bool IsAbnormal { get; set; }
    public bool IsCritical { get; set; }
    public string? Comments { get; set; }
}

// Event DTOs
public class LabOrderCompletedEvent : IEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid LabOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public DateTime CompletedAt { get; set; }
    public int TotalTests { get; set; }
    public int AbnormalResults { get; set; }
    public int CriticalResults { get; set; }
}
