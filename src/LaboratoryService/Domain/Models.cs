namespace LaboratoryService.Domain;

public class LabTest
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TestCode { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TurnaroundTimeHours { get; set; }
    public string? SampleType { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class LabTestParameter
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid LabTestId { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal? ReferenceMin { get; set; }
    public decimal? ReferenceMax { get; set; }
    public decimal? CriticalMin { get; set; }
    public decimal? CriticalMax { get; set; }
    public string? ReferenceRange { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class LabOrder
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, SampleCollected, InProgress, Completed, Cancelled
    public string Priority { get; set; } = string.Empty; // Routine, Urgent, STAT
    public DateTime? SampleCollectedAt { get; set; }
    public string? SampleCollectedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public string? ClinicalNotes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class LabOrderItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid LabOrderId { get; set; }
    public Guid LabTestId { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, InProgress, Completed
    public DateTime? ResultEnteredAt { get; set; }
    public string? ResultEnteredBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class LabResult
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid LabOrderItemId { get; set; }
    public Guid LabTestParameterId { get; set; }
    public string? Value { get; set; }
    public bool IsAbnormal { get; set; }
    public bool IsCritical { get; set; }
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class LabSequence
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
    public DateTime UpdatedAt { get; set; }
}
