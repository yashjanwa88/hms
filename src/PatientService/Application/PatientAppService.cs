using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace PatientService.Application;

public interface IPatientService
{
    Task<PatientResponse> CreatePatientAsync(CreatePatientRequest request, Guid tenantId, string tenantCode, Guid createdBy);
    Task<PatientResponse?> GetPatientByIdAsync(Guid id, Guid tenantId);
    Task<PatientResponse?> GetPatientByUHIDAsync(string uhid, Guid tenantId);
    Task<bool> UpdatePatientAsync(Guid id, UpdatePatientRequest request, Guid tenantId, Guid updatedBy);
    Task<bool> DeactivatePatientAsync(Guid id, Guid tenantId, Guid deactivatedBy);
    Task<PagedResult<PatientResponse>> SearchPatientsAsync(PatientSearchRequest request, Guid tenantId);
    Task<DuplicateCheckResponse> CheckDuplicatesAsync(string mobileNumber, string firstName, string lastName, DateTime dateOfBirth, Guid tenantId);
    Task<bool> MergePatientsAsync(MergePatientRequest request, Guid tenantId, Guid mergedBy);
    Task<PatientStatsResponse> GetStatsAsync(Guid tenantId);
    Task<bool> IncrementVisitCountAsync(Guid id, Guid tenantId);
    Task<List<QuickSearchResponse>> QuickSearchAsync(QuickSearchRequest request, Guid tenantId);
    Task<List<QuickSearchResponse>> GetRecentPatientsAsync(Guid tenantId, int limit);
}

public class PatientAppService : IPatientService
{
    private readonly IPatientRepository _patientRepository;
    private readonly IEventBus _eventBus;
    private readonly IDatabase? _cache;
    private readonly ILogger<PatientAppService> _logger;
    private readonly Shared.Common.Services.IAuditClient _auditClient;

    public PatientAppService(
        IPatientRepository patientRepository,
        IEventBus eventBus,
        ILogger<PatientAppService> logger,
        Shared.Common.Services.IAuditClient auditClient,
        IConnectionMultiplexer? redis = null)
    {
        _patientRepository = patientRepository;
        _eventBus = eventBus;
        _logger = logger;
        _auditClient = auditClient;
        _cache = redis?.GetDatabase();
    }

    public async Task<PatientResponse> CreatePatientAsync(CreatePatientRequest request, Guid tenantId, string tenantCode, Guid createdBy)
    {
        // Check duplicates
        var duplicates = await _patientRepository.CheckDuplicatesAsync(
            tenantId, 
            request.MobileNumber, 
            request.FirstName, 
            request.LastName, 
            request.DateOfBirth
        );

        if (duplicates.Any())
        {
            _logger.LogWarning("Potential duplicate patient found for mobile: {Mobile}", request.MobileNumber);
        }

        var uhid = await _patientRepository.GenerateUHIDAsync(tenantId, tenantCode);

        var patient = new Patient
        {
            UHID = uhid,
            FirstName = request.FirstName,
            MiddleName = request.MiddleName,
            LastName = request.LastName,
            Gender = request.Gender,
            DateOfBirth = request.DateOfBirth,
            BloodGroup = request.BloodGroup,
            MaritalStatus = request.MaritalStatus,
            
            MobileNumber = request.MobileNumber,
            AlternateMobile = request.AlternateMobile,
            Email = request.Email,
            WhatsAppNumber = request.WhatsAppNumber,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            Pincode = request.Pincode,
            Country = request.Country,
            
            AllergiesSummary = request.AllergiesSummary,
            ChronicConditions = request.ChronicConditions,
            CurrentMedications = request.CurrentMedications,
            DisabilityStatus = request.DisabilityStatus,
            OrganDonor = request.OrganDonor,
            
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactRelation = request.EmergencyContactRelation,
            EmergencyContactMobile = request.EmergencyContactMobile,
            
            InsuranceProviderId = request.InsuranceProviderId,
            PolicyNumber = request.PolicyNumber,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,

            ConsentTermsAccepted = request.ConsentTermsAccepted,
            ConsentPrivacyAccepted = request.ConsentPrivacyAccepted,
            ConsentHealthDataSharing = request.ConsentHealthDataSharing,
            ConsentRecordedAt = request.ConsentTermsAccepted && request.ConsentPrivacyAccepted && request.ConsentHealthDataSharing
                ? DateTime.UtcNow
                : null,
            
            TenantId = tenantId,
            RegisteredBy = createdBy,
            CreatedBy = createdBy
        };

        await _patientRepository.CreateAsync(patient);

        _ = _auditClient.LogAsync("PatientService", "Patient", patient.Id, "CREATE", 
            null, patient, createdBy, tenantId);

        _logger.LogInformation("Patient created: {UHID} for tenant: {TenantId}", uhid, tenantId);

        return MapToResponse(patient);
    }

    public async Task<PatientResponse?> GetPatientByIdAsync(Guid id, Guid tenantId)
    {
        var cacheKey = $"patient:{tenantId}:{id}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<PatientResponse>(cached!);
            }
        }

        var patient = await _patientRepository.GetByIdAsync(id, tenantId);
        if (patient == null) return null;

        var response = MapToResponse(patient);

        if (_cache != null)
        {
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(10));
        }

        return response;
    }

    public async Task<PatientResponse?> GetPatientByUHIDAsync(string uhid, Guid tenantId)
    {
        var patient = await _patientRepository.GetByUHIDAsync(uhid, tenantId);
        return patient == null ? null : MapToResponse(patient);
    }

    public async Task<bool> UpdatePatientAsync(Guid id, UpdatePatientRequest request, Guid tenantId, Guid updatedBy)
    {
        var patient = await _patientRepository.GetByIdAsync(id, tenantId);
        if (patient == null) return false;

        patient.FirstName = request.FirstName;
        patient.MiddleName = request.MiddleName;
        patient.LastName = request.LastName;
        patient.Gender = request.Gender;
        patient.DateOfBirth = request.DateOfBirth;
        patient.BloodGroup = request.BloodGroup;
        patient.MaritalStatus = request.MaritalStatus;
        
        patient.MobileNumber = request.MobileNumber;
        patient.AlternateMobile = request.AlternateMobile;
        patient.Email = request.Email;
        patient.WhatsAppNumber = request.WhatsAppNumber;
        patient.AddressLine1 = request.AddressLine1;
        patient.AddressLine2 = request.AddressLine2;
        patient.City = request.City;
        patient.State = request.State;
        patient.Pincode = request.Pincode;
        patient.Country = request.Country;
        
        patient.AllergiesSummary = request.AllergiesSummary;
        patient.ChronicConditions = request.ChronicConditions;
        patient.CurrentMedications = request.CurrentMedications;
        patient.DisabilityStatus = request.DisabilityStatus;
        patient.OrganDonor = request.OrganDonor;
        
        patient.EmergencyContactName = request.EmergencyContactName;
        patient.EmergencyContactRelation = request.EmergencyContactRelation;
        patient.EmergencyContactMobile = request.EmergencyContactMobile;
        
        patient.InsuranceProviderId = request.InsuranceProviderId;
        patient.PolicyNumber = request.PolicyNumber;
        patient.ValidFrom = request.ValidFrom;
        patient.ValidTo = request.ValidTo;
        patient.Status = request.Status;
        if (request.ConsentTermsAccepted.HasValue) patient.ConsentTermsAccepted = request.ConsentTermsAccepted.Value;
        if (request.ConsentPrivacyAccepted.HasValue) patient.ConsentPrivacyAccepted = request.ConsentPrivacyAccepted.Value;
        if (request.ConsentHealthDataSharing.HasValue) patient.ConsentHealthDataSharing = request.ConsentHealthDataSharing.Value;
        if (request.ConsentTermsAccepted == true && request.ConsentPrivacyAccepted == true && request.ConsentHealthDataSharing == true)
            patient.ConsentRecordedAt = DateTime.UtcNow;
        
        patient.UpdatedBy = updatedBy;

        var result = await _patientRepository.UpdateAsync(patient);

        if (result)
        {
            _ = _auditClient.LogAsync("PatientService", "Patient", id, "UPDATE", 
                null, patient, updatedBy, tenantId);
            
            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"patient:{tenantId}:{id}");
            }
        }

        return result;
    }

    public async Task<bool> DeactivatePatientAsync(Guid id, Guid tenantId, Guid deactivatedBy)
    {
        var patient = await _patientRepository.GetByIdAsync(id, tenantId);
        if (patient == null) return false;

        patient.Status = "Inactive";
        patient.UpdatedBy = deactivatedBy;

        var result = await _patientRepository.UpdateAsync(patient);

        if (result && _cache != null)
        {
            await _cache.KeyDeleteAsync($"patient:{tenantId}:{id}");
        }

        return result;
    }

    public async Task<PagedResult<PatientResponse>> SearchPatientsAsync(PatientSearchRequest request, Guid tenantId)
    {
        var result = await _patientRepository.SearchAsync(request, tenantId);

        return new PagedResult<PatientResponse>
        {
            Items = result.Items.Select(MapToResponse).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<DuplicateCheckResponse> CheckDuplicatesAsync(string mobileNumber, string firstName, string lastName, DateTime dateOfBirth, Guid tenantId)
    {
        var duplicates = await _patientRepository.CheckDuplicatesAsync(tenantId, mobileNumber, firstName, lastName, dateOfBirth);

        return new DuplicateCheckResponse
        {
            IsDuplicate = duplicates.Any(),
            PotentialDuplicates = duplicates.Select(MapToResponse).ToList()
        };
    }

    public async Task<bool> MergePatientsAsync(MergePatientRequest request, Guid tenantId, Guid mergedBy)
    {
        var result = await _patientRepository.MergePatientsAsync(request.PrimaryPatientId, request.SecondaryPatientId, tenantId, mergedBy);

        if (result)
        {
            _ = _auditClient.LogAsync("PatientService", "Patient", request.PrimaryPatientId, "MERGE", 
                new { SecondaryPatientId = request.SecondaryPatientId }, 
                new { PrimaryPatientId = request.PrimaryPatientId }, mergedBy, tenantId);
            
            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"patient:{tenantId}:{request.PrimaryPatientId}");
                await _cache.KeyDeleteAsync($"patient:{tenantId}:{request.SecondaryPatientId}");
            }
        }

        return result;
    }

    public async Task<PatientStatsResponse> GetStatsAsync(Guid tenantId)
    {
        var cacheKey = $"patient:stats:{tenantId}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<PatientStatsResponse>(cached!)!;
            }
        }

        var stats = await _patientRepository.GetStatsAsync(tenantId);

        if (_cache != null)
        {
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(stats), TimeSpan.FromMinutes(5));
        }

        return stats;
    }

    public async Task<bool> IncrementVisitCountAsync(Guid id, Guid tenantId)
    {
        var result = await _patientRepository.IncrementVisitCountAsync(id, tenantId);

        if (result && _cache != null)
        {
            await _cache.KeyDeleteAsync($"patient:{tenantId}:{id}");
        }

        return result;
    }

    public async Task<List<QuickSearchResponse>> QuickSearchAsync(QuickSearchRequest request, Guid tenantId)
    {
        var patients = await _patientRepository.QuickSearchAsync(request.SearchTerm, tenantId, request.MaxResults);
        return patients.Select(p => new QuickSearchResponse
        {
            Id = p.Id,
            UHID = p.UHID,
            FullName = $"{p.FirstName} {p.MiddleName} {p.LastName}".Trim(),
            MobileNumber = p.MobileNumber,
            Age = p.Age,
            Gender = p.Gender
        }).ToList();
    }

    public async Task<List<QuickSearchResponse>> GetRecentPatientsAsync(Guid tenantId, int limit)
    {
        var patients = await _patientRepository.GetRecentPatientsAsync(tenantId, limit);
        return patients.Select(p => new QuickSearchResponse
        {
            Id = p.Id,
            UHID = p.UHID,
            FullName = $"{p.FirstName} {p.MiddleName} {p.LastName}".Trim(),
            MobileNumber = p.MobileNumber,
            Age = p.Age,
            Gender = p.Gender
        }).ToList();
    }

    private static PatientResponse MapToResponse(Patient patient)
    {
        return new PatientResponse
        {
            Id = patient.Id,
            UHID = patient.UHID,
            FirstName = patient.FirstName,
            MiddleName = patient.MiddleName,
            LastName = patient.LastName,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Age = patient.Age,
            BloodGroup = patient.BloodGroup,
            MaritalStatus = patient.MaritalStatus,
            
            MobileNumber = patient.MobileNumber,
            AlternateMobile = patient.AlternateMobile,
            Email = patient.Email,
            WhatsAppNumber = patient.WhatsAppNumber,
            AddressLine1 = patient.AddressLine1,
            City = patient.City,
            State = patient.State,
            Pincode = patient.Pincode,
            
            AllergiesSummary = patient.AllergiesSummary,
            ChronicConditions = patient.ChronicConditions,
            EmergencyContactName = patient.EmergencyContactName,
            EmergencyContactMobile = patient.EmergencyContactMobile,
            
            PolicyNumber = patient.PolicyNumber,
            ValidFrom = patient.ValidFrom,
            ValidTo = patient.ValidTo,

            ConsentTermsAccepted = patient.ConsentTermsAccepted,
            ConsentPrivacyAccepted = patient.ConsentPrivacyAccepted,
            ConsentHealthDataSharing = patient.ConsentHealthDataSharing,
            ConsentRecordedAt = patient.ConsentRecordedAt,
            
            RegistrationDate = patient.RegistrationDate,
            Status = patient.Status,
            VisitCount = patient.VisitCount
        };
    }
}
