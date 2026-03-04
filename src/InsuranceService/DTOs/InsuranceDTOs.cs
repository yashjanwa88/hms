using Shared.Common.Models;

namespace InsuranceService.DTOs;

public class CreateProviderRequest
{
    public string ProviderCode { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
}

public class CreatePolicyRequest
{
    public Guid ProviderId { get; set; }
    public Guid PatientId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal CoverageAmount { get; set; }
    public string? Notes { get; set; }
}

public class CreatePreAuthRequest
{
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string TreatmentType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
}

public class ApprovePreAuthRequest
{
    public decimal ApprovedAmount { get; set; }
    public string? Notes { get; set; }
}

public class RejectPreAuthRequest
{
    public string RejectionReason { get; set; } = string.Empty;
}

public class CreateClaimRequest
{
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? PreAuthId { get; set; }
    public Guid? InvoiceId { get; set; }
    public decimal ClaimAmount { get; set; }
    public string ClaimType { get; set; } = string.Empty;
    public string? Documents { get; set; }
    public string? Notes { get; set; }
}

public class UpdateClaimStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public decimal? ApprovedAmount { get; set; }
    public string? RejectionReason { get; set; }
}

public class SettleClaimRequest
{
    public decimal SettledAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? Remarks { get; set; }
}

public class ProviderResponse
{
    public Guid Id { get; set; }
    public string ProviderCode { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PolicyResponse
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal CoverageAmount { get; set; }
    public decimal UsedAmount { get; set; }
    public decimal AvailableAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PreAuthResponse
{
    public Guid Id { get; set; }
    public string PreAuthNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? EncounterId { get; set; }
    public DateTime RequestDate { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string TreatmentType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? ApprovedAmount { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ClaimResponse
{
    public Guid Id { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? PreAuthId { get; set; }
    public string? PreAuthNumber { get; set; }
    public Guid? InvoiceId { get; set; }
    public DateTime ClaimDate { get; set; }
    public decimal ClaimAmount { get; set; }
    public string ClaimType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? ApprovedAmount { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ReviewDate { get; set; }
    public string? Documents { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SettlementResponse
{
    public Guid Id { get; set; }
    public Guid ClaimId { get; set; }
    public string SettlementNumber { get; set; } = string.Empty;
    public DateTime SettlementDate { get; set; }
    public decimal SettledAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}
