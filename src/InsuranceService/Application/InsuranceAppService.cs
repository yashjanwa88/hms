using InsuranceService.Domain;
using InsuranceService.DTOs;
using InsuranceService.Events;
using InsuranceService.Integrations;
using InsuranceService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace InsuranceService.Application;

public interface IInsuranceService
{
    Task<ProviderResponse> CreateProviderAsync(CreateProviderRequest request, Guid tenantId, Guid createdBy);
    Task<List<ProviderResponse>> GetProvidersAsync(Guid tenantId);
    Task<PolicyResponse> CreatePolicyAsync(CreatePolicyRequest request, Guid tenantId, Guid createdBy, string token);
    Task<List<PolicyResponse>> GetPoliciesByPatientIdAsync(Guid patientId, Guid tenantId, string token);
    Task<PreAuthResponse> CreatePreAuthAsync(CreatePreAuthRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token);
    Task<PreAuthResponse?> GetPreAuthByIdAsync(Guid id, Guid tenantId, string token);
    Task<bool> ApprovePreAuthAsync(Guid id, ApprovePreAuthRequest request, Guid tenantId, Guid approvedBy);
    Task<bool> RejectPreAuthAsync(Guid id, RejectPreAuthRequest request, Guid tenantId, Guid rejectedBy);
    Task<ClaimResponse> CreateClaimAsync(CreateClaimRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token);
    Task<ClaimResponse?> GetClaimByIdAsync(Guid id, Guid tenantId, string token);
    Task<List<ClaimResponse>> GetClaimsByInvoiceIdAsync(Guid invoiceId, Guid tenantId, string token);
    Task<bool> UpdateClaimStatusAsync(Guid id, UpdateClaimStatusRequest request, Guid tenantId, Guid reviewedBy);
    Task<SettlementResponse> SettleClaimAsync(Guid id, SettleClaimRequest request, Guid tenantId, string tenantCode, Guid settledBy);
}

public class InsuranceAppService : IInsuranceService
{
    private readonly IInsuranceProviderRepository _providerRepository;
    private readonly IInsurancePolicyRepository _policyRepository;
    private readonly IPreAuthorizationRepository _preAuthRepository;
    private readonly IInsuranceClaimRepository _claimRepository;
    private readonly IClaimSettlementRepository _settlementRepository;
    private readonly IPatientServiceClient _patientClient;
    private readonly IEventBus _eventBus;
    private readonly IDatabase? _cache;
    private readonly ILogger<InsuranceAppService> _logger;

    public InsuranceAppService(
        IInsuranceProviderRepository providerRepository,
        IInsurancePolicyRepository policyRepository,
        IPreAuthorizationRepository preAuthRepository,
        IInsuranceClaimRepository claimRepository,
        IClaimSettlementRepository settlementRepository,
        IPatientServiceClient patientClient,
        IEventBus eventBus,
        ILogger<InsuranceAppService> logger,
        IConnectionMultiplexer? redis = null)
    {
        _providerRepository = providerRepository;
        _policyRepository = policyRepository;
        _preAuthRepository = preAuthRepository;
        _claimRepository = claimRepository;
        _settlementRepository = settlementRepository;
        _patientClient = patientClient;
        _eventBus = eventBus;
        _logger = logger;
        _cache = redis?.GetDatabase();
    }

    public async Task<ProviderResponse> CreateProviderAsync(CreateProviderRequest request, Guid tenantId, Guid createdBy)
    {
        var existing = await _providerRepository.GetByCodeAsync(request.ProviderCode, tenantId);
        if (existing != null) throw new Exception("Provider code already exists");

        var provider = new InsuranceProvider
        {
            ProviderCode = request.ProviderCode,
            ProviderName = request.ProviderName,
            ContactPerson = request.ContactPerson,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            Address = request.Address,
            IsActive = true,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _providerRepository.CreateAsync(provider);

        return new ProviderResponse
        {
            Id = provider.Id,
            ProviderCode = provider.ProviderCode,
            ProviderName = provider.ProviderName,
            ContactPerson = provider.ContactPerson,
            ContactEmail = provider.ContactEmail,
            ContactPhone = provider.ContactPhone,
            Address = provider.Address,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt
        };
    }

    public async Task<List<ProviderResponse>> GetProvidersAsync(Guid tenantId)
    {
        var providers = await _providerRepository.GetActiveProvidersAsync(tenantId);
        return providers.Select(p => new ProviderResponse
        {
            Id = p.Id,
            ProviderCode = p.ProviderCode,
            ProviderName = p.ProviderName,
            ContactPerson = p.ContactPerson,
            ContactEmail = p.ContactEmail,
            ContactPhone = p.ContactPhone,
            Address = p.Address,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<PolicyResponse> CreatePolicyAsync(CreatePolicyRequest request, Guid tenantId, Guid createdBy, string token)
    {
        var provider = await _providerRepository.GetByIdAsync(request.ProviderId, tenantId);
        if (provider == null) throw new Exception("Provider not found");

        var patient = await _patientClient.GetPatientAsync(request.PatientId, tenantId, token);
        if (patient == null) throw new Exception("Patient not found");

        var existing = await _policyRepository.GetByPolicyNumberAsync(request.PolicyNumber, tenantId);
        if (existing != null) throw new Exception("Policy number already exists");

        var policy = new InsurancePolicy
        {
            ProviderId = request.ProviderId,
            PatientId = request.PatientId,
            PolicyNumber = request.PolicyNumber,
            PolicyType = request.PolicyType,
            StartDate = request.StartDate.Date,
            EndDate = request.EndDate.Date,
            CoverageAmount = request.CoverageAmount,
            UsedAmount = 0,
            AvailableAmount = request.CoverageAmount,
            Status = "Active",
            Notes = request.Notes,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _policyRepository.CreateAsync(policy);

        _eventBus.Publish(new PolicyCreatedEvent
        {
            TenantId = tenantId,
            PolicyId = policy.Id,
            PolicyNumber = policy.PolicyNumber,
            PatientId = policy.PatientId,
            ProviderId = policy.ProviderId,
            CoverageAmount = policy.CoverageAmount
        });

        return new PolicyResponse
        {
            Id = policy.Id,
            ProviderId = policy.ProviderId,
            ProviderName = provider.ProviderName,
            PatientId = policy.PatientId,
            PatientName = patient.FullName,
            PolicyNumber = policy.PolicyNumber,
            PolicyType = policy.PolicyType,
            StartDate = policy.StartDate,
            EndDate = policy.EndDate,
            CoverageAmount = policy.CoverageAmount,
            UsedAmount = policy.UsedAmount,
            AvailableAmount = policy.AvailableAmount,
            Status = policy.Status,
            Notes = policy.Notes,
            CreatedAt = policy.CreatedAt
        };
    }

    public async Task<List<PolicyResponse>> GetPoliciesByPatientIdAsync(Guid patientId, Guid tenantId, string token)
    {
        var policies = await _policyRepository.GetByPatientIdAsync(patientId, tenantId);
        var patient = await _patientClient.GetPatientAsync(patientId, tenantId, token);

        var responses = new List<PolicyResponse>();
        foreach (var policy in policies)
        {
            var provider = await _providerRepository.GetByIdAsync(policy.ProviderId, tenantId);
            responses.Add(new PolicyResponse
            {
                Id = policy.Id,
                ProviderId = policy.ProviderId,
                ProviderName = provider?.ProviderName ?? "Unknown",
                PatientId = policy.PatientId,
                PatientName = patient?.FullName ?? "Unknown",
                PolicyNumber = policy.PolicyNumber,
                PolicyType = policy.PolicyType,
                StartDate = policy.StartDate,
                EndDate = policy.EndDate,
                CoverageAmount = policy.CoverageAmount,
                UsedAmount = policy.UsedAmount,
                AvailableAmount = policy.AvailableAmount,
                Status = policy.Status,
                Notes = policy.Notes,
                CreatedAt = policy.CreatedAt
            });
        }

        return responses;
    }

    public async Task<PreAuthResponse> CreatePreAuthAsync(CreatePreAuthRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token)
    {
        var policy = await ValidatePolicyAsync(request.PolicyId, tenantId);
        var patient = await _patientClient.GetPatientAsync(request.PatientId, tenantId, token);
        if (patient == null) throw new Exception("Patient not found");

        if (request.EstimatedAmount > policy.AvailableAmount)
            throw new Exception("Estimated amount exceeds available coverage");

        var preAuthNumber = await _preAuthRepository.GeneratePreAuthNumberAsync(tenantId, tenantCode);

        var preAuth = new PreAuthorization
        {
            PreAuthNumber = preAuthNumber,
            PolicyId = request.PolicyId,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            RequestDate = DateTime.UtcNow,
            EstimatedAmount = request.EstimatedAmount,
            TreatmentType = request.TreatmentType,
            Diagnosis = request.Diagnosis,
            Status = "Pending",
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _preAuthRepository.CreateAsync(preAuth);

        return new PreAuthResponse
        {
            Id = preAuth.Id,
            PreAuthNumber = preAuth.PreAuthNumber,
            PolicyId = preAuth.PolicyId,
            PolicyNumber = policy.PolicyNumber,
            PatientId = preAuth.PatientId,
            PatientName = patient.FullName,
            EncounterId = preAuth.EncounterId,
            RequestDate = preAuth.RequestDate,
            EstimatedAmount = preAuth.EstimatedAmount,
            TreatmentType = preAuth.TreatmentType,
            Diagnosis = preAuth.Diagnosis,
            Status = preAuth.Status,
            CreatedAt = preAuth.CreatedAt
        };
    }

    public async Task<PreAuthResponse?> GetPreAuthByIdAsync(Guid id, Guid tenantId, string token)
    {
        var cacheKey = $"preauth:{tenantId}:{id}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
                return JsonSerializer.Deserialize<PreAuthResponse>(cached!);
        }

        var preAuth = await _preAuthRepository.GetByIdAsync(id, tenantId);
        if (preAuth == null) return null;

        var policy = await _policyRepository.GetByIdAsync(preAuth.PolicyId, tenantId);
        var patient = await _patientClient.GetPatientAsync(preAuth.PatientId, tenantId, token);

        var response = new PreAuthResponse
        {
            Id = preAuth.Id,
            PreAuthNumber = preAuth.PreAuthNumber,
            PolicyId = preAuth.PolicyId,
            PolicyNumber = policy?.PolicyNumber ?? "Unknown",
            PatientId = preAuth.PatientId,
            PatientName = patient?.FullName ?? "Unknown",
            EncounterId = preAuth.EncounterId,
            RequestDate = preAuth.RequestDate,
            EstimatedAmount = preAuth.EstimatedAmount,
            TreatmentType = preAuth.TreatmentType,
            Diagnosis = preAuth.Diagnosis,
            Status = preAuth.Status,
            ApprovedAmount = preAuth.ApprovedAmount,
            RejectionReason = preAuth.RejectionReason,
            ResponseDate = preAuth.ResponseDate,
            CreatedAt = preAuth.CreatedAt
        };

        if (_cache != null)
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(10));

        return response;
    }

    public async Task<bool> ApprovePreAuthAsync(Guid id, ApprovePreAuthRequest request, Guid tenantId, Guid approvedBy)
    {
        var preAuth = await _preAuthRepository.GetByIdAsync(id, tenantId);
        if (preAuth == null) return false;
        if (preAuth.Status != "Pending") throw new Exception("PreAuth is not in pending status");

        var policy = await _policyRepository.GetByIdAsync(preAuth.PolicyId, tenantId);
        if (policy == null) throw new Exception("Policy not found");

        if (request.ApprovedAmount > policy.AvailableAmount)
            throw new Exception("Approved amount exceeds available coverage");

        preAuth.Status = "Approved";
        preAuth.ApprovedAmount = request.ApprovedAmount;
        preAuth.ResponseDate = DateTime.UtcNow;
        preAuth.ReviewedBy = approvedBy;
        preAuth.UpdatedBy = approvedBy;

        var result = await _preAuthRepository.UpdateAsync(preAuth);

        if (result)
        {
            if (_cache != null)
                await _cache.KeyDeleteAsync($"preauth:{tenantId}:{id}");

            _eventBus.Publish(new PreAuthApprovedEvent
            {
                TenantId = tenantId,
                PreAuthId = preAuth.Id,
                PreAuthNumber = preAuth.PreAuthNumber,
                PolicyId = preAuth.PolicyId,
                PatientId = preAuth.PatientId,
                ApprovedAmount = preAuth.ApprovedAmount.Value
            });
        }

        return result;
    }

    public async Task<bool> RejectPreAuthAsync(Guid id, RejectPreAuthRequest request, Guid tenantId, Guid rejectedBy)
    {
        var preAuth = await _preAuthRepository.GetByIdAsync(id, tenantId);
        if (preAuth == null) return false;
        if (preAuth.Status != "Pending") throw new Exception("PreAuth is not in pending status");

        preAuth.Status = "Rejected";
        preAuth.RejectionReason = request.RejectionReason;
        preAuth.ResponseDate = DateTime.UtcNow;
        preAuth.ReviewedBy = rejectedBy;
        preAuth.UpdatedBy = rejectedBy;

        var result = await _preAuthRepository.UpdateAsync(preAuth);

        if (result && _cache != null)
            await _cache.KeyDeleteAsync($"preauth:{tenantId}:{id}");

        return result;
    }

    public async Task<ClaimResponse> CreateClaimAsync(CreateClaimRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token)
    {
        var policy = await ValidatePolicyAsync(request.PolicyId, tenantId);
        var patient = await _patientClient.GetPatientAsync(request.PatientId, tenantId, token);
        if (patient == null) throw new Exception("Patient not found");

        if (request.ClaimAmount > policy.AvailableAmount)
            throw new Exception("Claim amount exceeds available coverage");

        PreAuthorization? preAuth = null;
        if (request.PreAuthId.HasValue)
        {
            preAuth = await _preAuthRepository.GetByIdAsync(request.PreAuthId.Value, tenantId);
            if (preAuth == null) throw new Exception("PreAuth not found");
            if (preAuth.Status != "Approved") throw new Exception("PreAuth must be approved before claim submission");
        }

        var claimNumber = await _claimRepository.GenerateClaimNumberAsync(tenantId, tenantCode);

        var claim = new InsuranceClaim
        {
            ClaimNumber = claimNumber,
            PolicyId = request.PolicyId,
            PatientId = request.PatientId,
            PreAuthId = request.PreAuthId,
            InvoiceId = request.InvoiceId,
            ClaimDate = DateTime.UtcNow,
            ClaimAmount = request.ClaimAmount,
            ClaimType = request.ClaimType,
            Status = "Submitted",
            Documents = request.Documents,
            Notes = request.Notes,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _claimRepository.CreateAsync(claim);

        _eventBus.Publish(new ClaimSubmittedEvent
        {
            TenantId = tenantId,
            ClaimId = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            PolicyId = claim.PolicyId,
            PatientId = claim.PatientId,
            ClaimAmount = claim.ClaimAmount,
            ClaimType = claim.ClaimType
        });

        return new ClaimResponse
        {
            Id = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            PolicyId = claim.PolicyId,
            PolicyNumber = policy.PolicyNumber,
            PatientId = claim.PatientId,
            PatientName = patient.FullName,
            PreAuthId = claim.PreAuthId,
            PreAuthNumber = preAuth?.PreAuthNumber,
            InvoiceId = claim.InvoiceId,
            ClaimDate = claim.ClaimDate,
            ClaimAmount = claim.ClaimAmount,
            ClaimType = claim.ClaimType,
            Status = claim.Status,
            Documents = claim.Documents,
            CreatedAt = claim.CreatedAt
        };
    }

    public async Task<ClaimResponse?> GetClaimByIdAsync(Guid id, Guid tenantId, string token)
    {
        var claim = await _claimRepository.GetByIdAsync(id, tenantId);
        if (claim == null) return null;

        var policy = await _policyRepository.GetByIdAsync(claim.PolicyId, tenantId);
        var patient = await _patientClient.GetPatientAsync(claim.PatientId, tenantId, token);
        PreAuthorization? preAuth = null;
        if (claim.PreAuthId.HasValue)
            preAuth = await _preAuthRepository.GetByIdAsync(claim.PreAuthId.Value, tenantId);

        return new ClaimResponse
        {
            Id = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            PolicyId = claim.PolicyId,
            PolicyNumber = policy?.PolicyNumber ?? "Unknown",
            PatientId = claim.PatientId,
            PatientName = patient?.FullName ?? "Unknown",
            PreAuthId = claim.PreAuthId,
            PreAuthNumber = preAuth?.PreAuthNumber,
            InvoiceId = claim.InvoiceId,
            ClaimDate = claim.ClaimDate,
            ClaimAmount = claim.ClaimAmount,
            ClaimType = claim.ClaimType,
            Status = claim.Status,
            ApprovedAmount = claim.ApprovedAmount,
            RejectionReason = claim.RejectionReason,
            ReviewDate = claim.ReviewDate,
            Documents = claim.Documents,
            CreatedAt = claim.CreatedAt
        };
    }

    public async Task<List<ClaimResponse>> GetClaimsByInvoiceIdAsync(Guid invoiceId, Guid tenantId, string token)
    {
        var claims = await _claimRepository.GetByInvoiceIdAsync(invoiceId, tenantId);
        var responses = new List<ClaimResponse>();

        foreach (var claim in claims)
        {
            var policy = await _policyRepository.GetByIdAsync(claim.PolicyId, tenantId);
            var patient = await _patientClient.GetPatientAsync(claim.PatientId, tenantId, token);

            responses.Add(new ClaimResponse
            {
                Id = claim.Id,
                ClaimNumber = claim.ClaimNumber,
                PolicyId = claim.PolicyId,
                PolicyNumber = policy?.PolicyNumber ?? "Unknown",
                PatientId = claim.PatientId,
                PatientName = patient?.FullName ?? "Unknown",
                InvoiceId = claim.InvoiceId,
                ClaimDate = claim.ClaimDate,
                ClaimAmount = claim.ClaimAmount,
                ClaimType = claim.ClaimType,
                Status = claim.Status,
                ApprovedAmount = claim.ApprovedAmount,
                CreatedAt = claim.CreatedAt
            });
        }

        return responses;
    }

    public async Task<bool> UpdateClaimStatusAsync(Guid id, UpdateClaimStatusRequest request, Guid tenantId, Guid reviewedBy)
    {
        var claim = await _claimRepository.GetByIdAsync(id, tenantId);
        if (claim == null) return false;

        if (request.Status == "Approved" && request.ApprovedAmount.HasValue)
        {
            if (request.ApprovedAmount.Value > claim.ClaimAmount)
                throw new Exception("Approved amount cannot exceed claim amount");

            claim.ApprovedAmount = request.ApprovedAmount.Value;
            
            _eventBus.Publish(new ClaimApprovedEvent
            {
                TenantId = tenantId,
                ClaimId = claim.Id,
                ClaimNumber = claim.ClaimNumber,
                PatientId = claim.PatientId,
                ApprovedAmount = claim.ApprovedAmount.Value
            });
        }

        if (request.Status == "Rejected")
            claim.RejectionReason = request.RejectionReason;

        claim.Status = request.Status;
        claim.ReviewDate = DateTime.UtcNow;
        claim.ReviewedBy = reviewedBy;
        claim.UpdatedBy = reviewedBy;

        return await _claimRepository.UpdateAsync(claim);
    }

    public async Task<SettlementResponse> SettleClaimAsync(Guid id, SettleClaimRequest request, Guid tenantId, string tenantCode, Guid settledBy)
    {
        var claim = await _claimRepository.GetByIdAsync(id, tenantId);
        if (claim == null) throw new Exception("Claim not found");
        if (claim.Status == "Rejected") throw new Exception("Cannot settle rejected claim");
        if (claim.Status != "Approved") throw new Exception("Claim must be approved before settlement");

        var existing = await _settlementRepository.GetByClaimIdAsync(id, tenantId);
        if (existing != null) throw new Exception("Claim already settled");

        if (request.SettledAmount > claim.ApprovedAmount)
            throw new Exception("Settled amount cannot exceed approved amount");

        var settlementNumber = await _settlementRepository.GenerateSettlementNumberAsync(tenantId, tenantCode);

        var settlement = new ClaimSettlement
        {
            ClaimId = id,
            SettlementNumber = settlementNumber,
            SettlementDate = DateTime.UtcNow,
            SettledAmount = request.SettledAmount,
            PaymentMethod = request.PaymentMethod,
            TransactionId = request.TransactionId,
            Remarks = request.Remarks,
            TenantId = tenantId,
            CreatedBy = settledBy
        };

        await _settlementRepository.CreateAsync(settlement);

        claim.Status = "Settled";
        claim.UpdatedBy = settledBy;
        await _claimRepository.UpdateAsync(claim);

        await _policyRepository.UpdateUsedAmountAsync(claim.PolicyId, request.SettledAmount, tenantId, settledBy);

        _eventBus.Publish(new ClaimSettledEvent
        {
            TenantId = tenantId,
            ClaimId = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            SettlementId = settlement.Id,
            PatientId = claim.PatientId,
            SettledAmount = settlement.SettledAmount
        });

        return new SettlementResponse
        {
            Id = settlement.Id,
            ClaimId = settlement.ClaimId,
            SettlementNumber = settlement.SettlementNumber,
            SettlementDate = settlement.SettlementDate,
            SettledAmount = settlement.SettledAmount,
            PaymentMethod = settlement.PaymentMethod,
            TransactionId = settlement.TransactionId,
            CreatedAt = settlement.CreatedAt
        };
    }

    private async Task<InsurancePolicy> ValidatePolicyAsync(Guid policyId, Guid tenantId)
    {
        var policy = await _policyRepository.GetByIdAsync(policyId, tenantId);
        if (policy == null) throw new Exception("Policy not found");
        if (policy.Status != "Active") throw new Exception("Policy must be active");
        if (policy.EndDate < DateTime.UtcNow.Date) throw new Exception("Policy has expired");
        return policy;
    }
}
