using Microsoft.Extensions.Logging;
using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Events;
using Shared.EventBus.Interfaces;

namespace PatientService.Application;

public class OptimizedPatientService : IPatientService
{
    private readonly IPatientRepository _patientRepository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<OptimizedPatientService> _logger;

    public OptimizedPatientService(
        IPatientRepository patientRepository,
        IEventBus eventBus,
        ILogger<OptimizedPatientService> logger)
    {
        _patientRepository = patientRepository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<PatientResponse> CreatePatientAsync(CreatePatientRequest request, Guid tenantId, string tenantCode, Guid userId)
    {
        try
        {
            _logger.LogInformation("Creating patient for tenant {TenantId} by user {UserId}", tenantId, userId);

            // Check for duplicates first (fast query)
            var duplicates = await _patientRepository.CheckDuplicatesAsync(
                tenantId, request.MobileNumber, request.FirstName, request.LastName, request.DateOfBirth);

            if (duplicates.Any())
            {
                _logger.LogWarning("Duplicate patient detected for mobile {Mobile} in tenant {TenantId}", 
                    request.MobileNumber, tenantId);
                throw new InvalidOperationException("Potential duplicate patient found");
            }

            // Generate UHID
            var uhid = await _patientRepository.GenerateUHIDAsync(tenantId, tenantCode);

            var patient = MapToEntity(request, tenantId, uhid, userId);
            var patientId = await _patientRepository.CreateAsync(patient);
            patient.Id = patientId;

            // Publish event asynchronously
            _ = Task.Run(() =>
            {
                try
                {
                    _eventBus.Publish(new PatientCreatedEvent
                    {
                        TenantId = tenantId,
                        PatientId = patientId,
                        PatientName = $"{request.FirstName} {request.LastName}",
                        Email = request.Email ?? string.Empty
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish PatientCreatedEvent for patient {PatientId}", patientId);
                }
            });

            _logger.LogInformation("Patient {PatientId} created successfully with UHID {UHID}", patientId, uhid);
            return MapToResponse(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create patient for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<PatientResponse?> GetPatientByIdAsync(Guid id, Guid tenantId)
    {
        try
        {
            var patient = await _patientRepository.GetByIdAsync(id, tenantId);
            return patient != null ? MapToResponse(patient) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get patient {PatientId} for tenant {TenantId}", id, tenantId);
            throw;
        }
    }

    public async Task<PatientResponse?> GetPatientByUHIDAsync(string uhid, Guid tenantId)
    {
        try
        {
            var patient = await _patientRepository.GetByUHIDAsync(uhid, tenantId);
            return patient != null ? MapToResponse(patient) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get patient by UHID {UHID} for tenant {TenantId}", uhid, tenantId);
            throw;
        }
    }

    public async Task<bool> UpdatePatientAsync(Guid id, UpdatePatientRequest request, Guid tenantId, Guid userId)
    {
        try
        {
            _logger.LogInformation("Updating patient {PatientId} for tenant {TenantId} by user {UserId}", id, tenantId, userId);

            var patient = await _patientRepository.GetByIdAsync(id, tenantId);
            if (patient == null)
            {
                _logger.LogWarning("Patient {PatientId} not found for update in tenant {TenantId}", id, tenantId);
                return false;
            }

            // Update only changed fields
            UpdatePatientFields(patient, request, userId);
            
            var result = await _patientRepository.UpdateAsync(patient);
            
            if (result)
            {
                _logger.LogInformation("Patient {PatientId} updated successfully", id);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update patient {PatientId} for tenant {TenantId}", id, tenantId);
            throw;
        }
    }

    public async Task<PagedResult<PatientResponse>> SearchPatientsAsync(PatientSearchRequest request, Guid tenantId)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var result = await _patientRepository.SearchAsync(request, tenantId);
            
            stopwatch.Stop();
            _logger.LogInformation("Patient search completed in {ElapsedMs}ms, returned {Count} results", 
                stopwatch.ElapsedMilliseconds, result.Items.Count);

            return new PagedResult<PatientResponse>
            {
                Items = result.Items.Select(MapToResponse).ToList(),
                TotalCount = result.TotalCount,
                PageNumber = result.PageNumber,
                PageSize = result.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search patients for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<DuplicateCheckResponse> CheckDuplicatesAsync(string mobileNumber, string firstName, string lastName, DateTime dateOfBirth, Guid tenantId)
    {
        try
        {
            var duplicates = await _patientRepository.CheckDuplicatesAsync(tenantId, mobileNumber, firstName, lastName, dateOfBirth);
            
            return new DuplicateCheckResponse
            {
                IsDuplicate = duplicates.Any(),
                PotentialDuplicates = duplicates.Select(MapToResponse).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check duplicates for mobile {Mobile} in tenant {TenantId}", mobileNumber, tenantId);
            throw;
        }
    }

    public async Task<bool> DeactivatePatientAsync(Guid id, Guid tenantId, Guid userId)
    {
        try
        {
            _logger.LogInformation("Deactivating patient {PatientId} for tenant {TenantId} by user {UserId}", id, tenantId, userId);

            var patient = await _patientRepository.GetByIdAsync(id, tenantId);
            if (patient == null)
            {
                return false;
            }

            patient.Status = "Inactive";
            patient.UpdatedBy = userId;
            patient.UpdatedAt = DateTime.UtcNow;

            var result = await _patientRepository.UpdateAsync(patient);
            
            if (result)
            {
                _logger.LogInformation("Patient {PatientId} deactivated successfully", id);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate patient {PatientId} for tenant {TenantId}", id, tenantId);
            throw;
        }
    }

    public async Task<bool> MergePatientsAsync(MergePatientRequest request, Guid tenantId, Guid userId)
    {
        try
        {
            _logger.LogInformation("Merging patients {SecondaryId} into {PrimaryId} for tenant {TenantId} by user {UserId}", 
                request.SecondaryPatientId, request.PrimaryPatientId, tenantId, userId);

            // Validate both patients exist
            var primaryTask = _patientRepository.GetByIdAsync(request.PrimaryPatientId, tenantId);
            var secondaryTask = _patientRepository.GetByIdAsync(request.SecondaryPatientId, tenantId);
            
            await Task.WhenAll(primaryTask, secondaryTask);
            
            if (primaryTask.Result == null || secondaryTask.Result == null)
            {
                _logger.LogWarning("One or both patients not found for merge operation");
                return false;
            }

            var result = await _patientRepository.MergePatientsAsync(request.PrimaryPatientId, request.SecondaryPatientId, tenantId, userId);
            
            if (result)
            {
                _logger.LogInformation("Patients merged successfully: {SecondaryId} -> {PrimaryId}", 
                    request.SecondaryPatientId, request.PrimaryPatientId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to merge patients for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<PatientStatsResponse> GetStatsAsync(Guid tenantId)
    {
        try
        {
            return await _patientRepository.GetStatsAsync(tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get patient stats for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<bool> IncrementVisitCountAsync(Guid patientId, Guid tenantId)
    {
        try
        {
            return await _patientRepository.IncrementVisitCountAsync(patientId, tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to increment visit count for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<List<QuickSearchResponse>> QuickSearchAsync(QuickSearchRequest request, Guid tenantId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to perform quick search for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<List<QuickSearchResponse>> GetRecentPatientsAsync(Guid tenantId, int limit)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get recent patients for tenant {TenantId}", tenantId);
            throw;
        }
    }

    private static Patient MapToEntity(CreatePatientRequest request, Guid tenantId, string uhid, Guid userId)
    {
        return new Patient
        {
            TenantId = tenantId,
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
            Country = request.Country ?? "India",
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
            RegisteredBy = userId,
            CreatedBy = userId
        };
    }

    private static void UpdatePatientFields(Patient patient, UpdatePatientRequest request, Guid userId)
    {
        patient.FirstName = request.FirstName ?? patient.FirstName;
        patient.MiddleName = request.MiddleName ?? patient.MiddleName;
        patient.LastName = request.LastName ?? patient.LastName;
        patient.Gender = request.Gender ?? patient.Gender;
        patient.DateOfBirth = request.DateOfBirth;
        patient.BloodGroup = request.BloodGroup ?? patient.BloodGroup;
        patient.MaritalStatus = request.MaritalStatus ?? patient.MaritalStatus;
        patient.MobileNumber = request.MobileNumber;
        patient.AlternateMobile = request.AlternateMobile ?? patient.AlternateMobile;
        patient.Email = request.Email ?? patient.Email;
        patient.WhatsAppNumber = request.WhatsAppNumber ?? patient.WhatsAppNumber;
        patient.AddressLine1 = request.AddressLine1 ?? patient.AddressLine1;
        patient.AddressLine2 = request.AddressLine2 ?? patient.AddressLine2;
        patient.City = request.City ?? patient.City;
        patient.State = request.State ?? patient.State;
        patient.Pincode = request.Pincode ?? patient.Pincode;
        patient.Country = request.Country ?? patient.Country;
        patient.AllergiesSummary = request.AllergiesSummary ?? patient.AllergiesSummary;
        patient.ChronicConditions = request.ChronicConditions ?? patient.ChronicConditions;
        patient.CurrentMedications = request.CurrentMedications ?? patient.CurrentMedications;
        patient.DisabilityStatus = request.DisabilityStatus ?? patient.DisabilityStatus;
        patient.OrganDonor = request.OrganDonor;
        patient.EmergencyContactName = request.EmergencyContactName ?? patient.EmergencyContactName;
        patient.EmergencyContactRelation = request.EmergencyContactRelation ?? patient.EmergencyContactRelation;
        patient.EmergencyContactMobile = request.EmergencyContactMobile ?? patient.EmergencyContactMobile;
        patient.InsuranceProviderId = request.InsuranceProviderId ?? patient.InsuranceProviderId;
        patient.PolicyNumber = request.PolicyNumber ?? patient.PolicyNumber;
        patient.ValidFrom = request.ValidFrom ?? patient.ValidFrom;
        patient.ValidTo = request.ValidTo ?? patient.ValidTo;
        patient.UpdatedBy = userId;
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