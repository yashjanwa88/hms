using Shared.Common.Models;

namespace PatientService.Domain;

// ── Masters ───────────────────────────────────────────────────────────────────

public class PatientPrefix : BaseEntity
{
    public string PrefixName { get; set; } = string.Empty;
    public string? GenderApplicable { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class PatientType : BaseEntity
{
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class RegistrationType : BaseEntity
{
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ValidityDays { get; set; } = 365;
    public decimal RegistrationFee { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

// ── Queue ─────────────────────────────────────────────────────────────────────

public class PatientQueue : BaseEntity
{
    public string TokenNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string Status { get; set; } = "Waiting";
    public string Priority { get; set; } = "Normal";
    public DateTime QueueDate { get; set; } = DateTime.UtcNow.Date;
    public DateTime RegistrationTime { get; set; } = DateTime.UtcNow;
    public DateTime? CalledTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public DateTime? CancelledTime { get; set; }
    public string? CancelReason { get; set; }
    public string? Notes { get; set; }
    public int? WaitingMinutes => CalledTime.HasValue
        ? (int)(CalledTime.Value - RegistrationTime).TotalMinutes
        : (int)(DateTime.UtcNow - RegistrationTime).TotalMinutes;
}

// ── Renewal ───────────────────────────────────────────────────────────────────

public class PatientRenewal : BaseEntity
{
    public Guid PatientId { get; set; }
    public string RenewalNumber { get; set; } = string.Empty;
    public DateTime PreviousValidTill { get; set; }
    public DateTime NewValidTill { get; set; }
    public int RenewalPeriodDays { get; set; }
    public decimal RenewalFee { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentReference { get; set; }
    public Guid RenewedBy { get; set; }
    public DateTime RenewedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}

// ── Card Reprint ──────────────────────────────────────────────────────────────

public class PatientCardReprint : BaseEntity
{
    public Guid PatientId { get; set; }
    public int ReprintNumber { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal Charges { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentReference { get; set; }
    public Guid ReprintedBy { get; set; }
    public string ReprintedByName { get; set; } = string.Empty;
    public DateTime ReprintedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

public class PatientAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientUHID { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = "Patient";
    public string? FieldChanged { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Description { get; set; }
    public Guid ChangedBy { get; set; }
    public string? ChangedByName { get; set; }
    public string? ChangedByRole { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

// ── Import Job ────────────────────────────────────────────────────────────────

public class PatientImportJob : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public long? FileSize { get; set; }
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ErrorDetails { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
