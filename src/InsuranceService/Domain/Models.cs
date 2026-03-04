using Shared.Common.Models;

namespace InsuranceService.Domain;

public class InsuranceProvider : BaseEntity
{
    public string ProviderCode { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public class InsurancePolicy : BaseEntity
{
    public Guid ProviderId { get; set; }
    public Guid PatientId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty; // Individual, Family, Corporate
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal CoverageAmount { get; set; }
    public decimal UsedAmount { get; set; }
    public decimal AvailableAmount { get; set; }
    public string Status { get; set; } = "Active"; // Active, Expired, Cancelled
    public string? Notes { get; set; }
}

public class PreAuthorization : BaseEntity
{
    public string PreAuthNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public DateTime RequestDate { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string TreatmentType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public decimal? ApprovedAmount { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ResponseDate { get; set; }
    public Guid? ReviewedBy { get; set; }
}

public class InsuranceClaim : BaseEntity
{
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? PreAuthId { get; set; }
    public Guid? InvoiceId { get; set; }
    public DateTime ClaimDate { get; set; }
    public decimal ClaimAmount { get; set; }
    public string ClaimType { get; set; } = string.Empty; // Cashless, Reimbursement
    public string Status { get; set; } = "Submitted"; // Submitted, UnderReview, Approved, Rejected, Settled
    public decimal? ApprovedAmount { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ReviewDate { get; set; }
    public Guid? ReviewedBy { get; set; }
    public string? Documents { get; set; }
    public string? Notes { get; set; }
}

public class ClaimSettlement : BaseEntity
{
    public Guid ClaimId { get; set; }
    public string SettlementNumber { get; set; } = string.Empty;
    public DateTime SettlementDate { get; set; }
    public decimal SettledAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? Remarks { get; set; }
}

public class InsuranceSequence : BaseEntity
{
    public int Year { get; set; }
    public int LastSequence { get; set; }
}
