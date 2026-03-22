using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace PatientService.Application;

public interface IPatientRegistrationService
{
    Task<PatientRegistrationResponse> RegisterPatientAsync(RegisterPatientRequest request, Guid tenantId, string tenantCode, Guid registeredBy);
    Task<DuplicateCheckResponse> CheckDuplicatesAsync(CheckDuplicateRequest request, Guid tenantId);
    Task<List<QuickSearchResponse>> QuickSearchAsync(QuickSearchRequest request, Guid tenantId);
    Task<PatientRegistrationResponse?> GetByUHIDAsync(string uhid, Guid tenantId);
}

public class PatientRegistrationService : IPatientRegistrationService
{
    private readonly IPatientRegistrationRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly IDatabase? _cache;
    private readonly ILogger<PatientRegistrationService> _logger;
    private readonly Shared.Common.Services.IAuditClient _auditClient;

    public PatientRegistrationService(
        IPatientRegistrationRepository repository,
        IEventBus eventBus,
        ILogger<PatientRegistrationService> logger,
        Shared.Common.Services.IAuditClient auditClient,
        IConnectionMultiplexer? redis = null)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
        _auditClient = auditClient;
        _cache = redis?.GetDatabase();
    }

    public async Task<PatientRegistrationResponse> RegisterPatientAsync(
        RegisterPatientRequest request, Guid tenantId, string tenantCode, Guid registeredBy)
    {
        // Validate age
        var age = DateTime.UtcNow.Year - request.DateOfBirth.Year;
        if (age < 0 || age > 150)
        {
            throw new ArgumentException("Invalid date of birth");
        }

        if (!request.ConsentTermsAccepted || !request.ConsentPrivacyAccepted || !request.ConsentHealthDataSharing)
        {
            throw new ArgumentException("All consent declarations must be accepted to register a patient.");
        }

        // Check for duplicates
        var duplicates = await _repository.CheckDuplicatesAsync(
            tenantId,
            request.MobileNumber,
            request.FirstName,
            request.LastName,
            request.DateOfBirth
        );

        // Generate UHID
        var uhid = await _repository.GenerateUHIDAsync(tenantId, tenantCode);

        // Map to entity
        var patient = new Patient
        {
            TenantId = tenantId,
            UHID = uhid,
            FirstName = request.FirstName.Trim(),
            MiddleName = request.MiddleName?.Trim(),
            LastName = request.LastName.Trim(),
            Gender = request.Gender,
            DateOfBirth = request.DateOfBirth.Date,
            BloodGroup = request.BloodGroup,
            MaritalStatus = request.MaritalStatus,
            
            MobileNumber = request.MobileNumber,
            AlternateMobile = request.AlternateMobile,
            Email = request.Email?.ToLower(),
            WhatsAppNumber = request.WhatsAppNumber ?? request.MobileNumber,
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
            ConsentRecordedAt = DateTime.UtcNow,
            
            RegisteredBy = registeredBy,
            CreatedBy = registeredBy
        };

        // Save to database
        await _repository.RegisterPatientAsync(patient);

        // Audit log (fire and forget)
        _ = Task.Run(() => _auditClient.LogAsync(
            "PatientService", 
            "Patient", 
            patient.Id, 
            "REGISTRATION",
            null, 
            new { patient.UHID, patient.FirstName, patient.LastName, patient.MobileNumber },
            registeredBy, 
            tenantId
        ));

        // Cache patient data
        if (_cache != null)
        {
            var cacheKey = $"patient:{tenantId}:{patient.Id}";
            await _cache.StringSetAsync(
                cacheKey, 
                JsonSerializer.Serialize(patient), 
                TimeSpan.FromMinutes(30)
            );
        }

        _logger.LogInformation(
            "Patient registered successfully. UHID: {UHID}, TenantId: {TenantId}", 
            uhid, tenantId
        );

        // Map to response
        var response = new PatientRegistrationResponse
        {
            Id = patient.Id,
            UHID = patient.UHID,
            FullName = $"{patient.FirstName} {patient.MiddleName} {patient.LastName}".Trim(),
            MobileNumber = patient.MobileNumber,
            DateOfBirth = patient.DateOfBirth,
            Age = patient.Age,
            Gender = patient.Gender,
            RegistrationDate = patient.RegistrationDate,
            Status = patient.Status,
            PotentialDuplicates = duplicates.Any() ? duplicates : null
        };

        return response;
    }

    public async Task<DuplicateCheckResponse> CheckDuplicatesAsync(CheckDuplicateRequest request, Guid tenantId)
    {
        var duplicates = await _repository.CheckDuplicatesAsync(
            tenantId,
            request.MobileNumber,
            request.FirstName,
            request.LastName,
            request.DateOfBirth
        );

        return new DuplicateCheckResponse
        {
            IsDuplicate = duplicates.Any(),
            PotentialDuplicates = duplicates.Select(d => new PatientResponse
            {
                Id = d.Id,
                UHID = d.UHID,
                FirstName = d.FullName.Split(' ').FirstOrDefault() ?? "",
                LastName = d.FullName.Split(' ').LastOrDefault() ?? "",
                MobileNumber = d.MobileNumber,
                DateOfBirth = d.DateOfBirth,
                Age = d.Age
            }).ToList()
        };
    }

    public async Task<List<QuickSearchResponse>> QuickSearchAsync(QuickSearchRequest request, Guid tenantId)
    {
        // Try cache first
        if (_cache != null)
        {
            var cacheKey = $"search:{tenantId}:{request.SearchTerm.ToLower()}";
            var cached = await _cache.StringGetAsync(cacheKey);
            
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<List<QuickSearchResponse>>(cached!) ?? new();
            }
        }

        var results = await _repository.QuickSearchAsync(tenantId, request.SearchTerm, request.MaxResults);

        // Cache results
        if (_cache != null && results.Any())
        {
            var cacheKey = $"search:{tenantId}:{request.SearchTerm.ToLower()}";
            await _cache.StringSetAsync(
                cacheKey, 
                JsonSerializer.Serialize(results), 
                TimeSpan.FromMinutes(5)
            );
        }

        return results;
    }

    public async Task<PatientRegistrationResponse?> GetByUHIDAsync(string uhid, Guid tenantId)
    {
        var patient = await _repository.GetByUHIDAsync(uhid, tenantId);
        
        if (patient == null) return null;

        return new PatientRegistrationResponse
        {
            Id = patient.Id,
            UHID = patient.UHID,
            FullName = $"{patient.FirstName} {patient.MiddleName} {patient.LastName}".Trim(),
            MobileNumber = patient.MobileNumber,
            DateOfBirth = patient.DateOfBirth,
            Age = patient.Age,
            Gender = patient.Gender,
            RegistrationDate = patient.RegistrationDate,
            Status = patient.Status
        };
    }
}
