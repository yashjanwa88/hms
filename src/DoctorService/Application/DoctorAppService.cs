using DoctorService.Domain;
using DoctorService.DTOs;
using DoctorService.Events;
using DoctorService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace DoctorService.Application;

public interface IDoctorService
{
    Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request, Guid tenantId, Guid createdBy);
    Task<DoctorResponse?> GetDoctorByIdAsync(Guid id, Guid tenantId);
    Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request, Guid tenantId, Guid updatedBy);
    Task<bool> DeleteDoctorAsync(Guid id, Guid tenantId, Guid deletedBy);
    Task<PagedResult<DoctorResponse>> SearchDoctorsAsync(DoctorSearchRequest request, Guid tenantId);
    Task<Guid> AddSpecializationAsync(Guid doctorId, AddSpecializationRequest request, Guid tenantId, Guid createdBy);
    Task<Guid> AddQualificationAsync(Guid doctorId, AddQualificationRequest request, Guid tenantId, Guid createdBy);
    Task<Guid> AddAvailabilityAsync(Guid doctorId, AddAvailabilityRequest request, Guid tenantId, Guid createdBy);
    Task<Guid> AddLeaveAsync(Guid doctorId, AddLeaveRequest request, Guid tenantId, Guid createdBy);
    Task<IEnumerable<AvailabilityResponse>> GetDoctorAvailabilityAsync(Guid doctorId, Guid tenantId);
}

public class DoctorAppService : IDoctorService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IDoctorSpecializationRepository _specializationRepository;
    private readonly IDoctorQualificationRepository _qualificationRepository;
    private readonly IDoctorAvailabilityRepository _availabilityRepository;
    private readonly IDoctorLeaveRepository _leaveRepository;
    private readonly IEventBus _eventBus;
    private readonly IDatabase? _cache;
    private readonly Shared.Common.Services.IAuditClient _auditClient;

    public DoctorAppService(
        IDoctorRepository doctorRepository,
        IDoctorSpecializationRepository specializationRepository,
        IDoctorQualificationRepository qualificationRepository,
        IDoctorAvailabilityRepository availabilityRepository,
        IDoctorLeaveRepository leaveRepository,
        IEventBus eventBus,
        Shared.Common.Services.IAuditClient auditClient,
        IConnectionMultiplexer? redis = null)
    {
        _doctorRepository = doctorRepository;
        _specializationRepository = specializationRepository;
        _qualificationRepository = qualificationRepository;
        _availabilityRepository = availabilityRepository;
        _leaveRepository = leaveRepository;
        _eventBus = eventBus;
        _auditClient = auditClient;
        _cache = redis?.GetDatabase();
    }

    public async Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request, Guid tenantId, Guid createdBy)
    {
        if (await _doctorRepository.IsMobileNumberExistsAsync(request.MobileNumber, tenantId))
        {
            throw new Exception("Mobile number already exists for another doctor");
        }

        var doctorCode = await _doctorRepository.GenerateDoctorCodeAsync(tenantId, tenantId.ToString().Substring(0, 8));

        var doctor = new Doctor
        {
            DoctorCode = doctorCode,
            FirstName = request.FirstName,
            MiddleName = request.MiddleName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            MobileNumber = request.MobileNumber,
            Email = request.Email,
            LicenseNumber = request.LicenseNumber,
            LicenseExpiryDate = request.LicenseExpiryDate,
            ExperienceYears = request.ExperienceYears,
            Department = request.Department,
            ConsultationFee = request.ConsultationFee,
            IsActive = true,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactNumber = request.EmergencyContactNumber,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _doctorRepository.CreateAsync(doctor);

        _ = _auditClient.LogAsync("DoctorService", "Doctor", doctor.Id, "CREATE", null, doctor, createdBy, tenantId);

        _eventBus?.Publish(new DoctorCreatedEvent
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            DoctorCode = doctor.DoctorCode,
            DoctorName = $"{doctor.FirstName} {doctor.LastName}",
            Department = doctor.Department,
            MobileNumber = doctor.MobileNumber,
            Email = doctor.Email
        });

        return MapToResponse(doctor);
    }

    public async Task<DoctorResponse?> GetDoctorByIdAsync(Guid id, Guid tenantId)
    {
        var cacheKey = $"doctor:{tenantId}:{id}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<DoctorResponse>(cached!);
            }
        }

        var doctor = await _doctorRepository.GetByIdAsync(id, tenantId);
        if (doctor == null) return null;

        var response = MapToResponse(doctor);

        if (_cache != null)
        {
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(10));
        }

        return response;
    }

    public async Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request, Guid tenantId, Guid updatedBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id, tenantId);
        if (doctor == null) return false;

        if (await _doctorRepository.IsMobileNumberExistsAsync(request.MobileNumber, tenantId, id))
        {
            throw new Exception("Mobile number already exists for another doctor");
        }

        doctor.FirstName = request.FirstName;
        doctor.MiddleName = request.MiddleName;
        doctor.LastName = request.LastName;
        doctor.DateOfBirth = request.DateOfBirth;
        doctor.Gender = request.Gender;
        doctor.MobileNumber = request.MobileNumber;
        doctor.Email = request.Email;
        doctor.LicenseNumber = request.LicenseNumber;
        doctor.LicenseExpiryDate = request.LicenseExpiryDate;
        doctor.ExperienceYears = request.ExperienceYears;
        doctor.Department = request.Department;
        doctor.ConsultationFee = request.ConsultationFee;
        doctor.IsActive = request.IsActive;
        doctor.EmergencyContactName = request.EmergencyContactName;
        doctor.EmergencyContactNumber = request.EmergencyContactNumber;
        doctor.UpdatedBy = updatedBy;

        var result = await _doctorRepository.UpdateAsync(doctor);

        if (result)
        {
            _ = _auditClient.LogAsync("DoctorService", "Doctor", doctor.Id, "UPDATE", null, doctor, updatedBy, tenantId);

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"doctor:{tenantId}:{id}");
            }

            _eventBus?.Publish(new DoctorUpdatedEvent
            {
                TenantId = tenantId,
                DoctorId = doctor.Id,
                DoctorCode = doctor.DoctorCode
            });
        }

        return result;
    }

    public async Task<bool> DeleteDoctorAsync(Guid id, Guid tenantId, Guid deletedBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id, tenantId);
        if (doctor == null) return false;

        var result = await _doctorRepository.SoftDeleteAsync(id, tenantId, deletedBy);

        if (result)
        {
            _ = _auditClient.LogAsync("DoctorService", "Doctor", id, "DELETE", doctor, null, deletedBy, tenantId);

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"doctor:{tenantId}:{id}");
            }

            _eventBus?.Publish(new DoctorDeletedEvent
            {
                TenantId = tenantId,
                DoctorId = id,
                DoctorCode = doctor.DoctorCode
            });
        }

        return result;
    }

    public async Task<PagedResult<DoctorResponse>> SearchDoctorsAsync(DoctorSearchRequest request, Guid tenantId)
    {
        var cacheKey = $"doctors:search:{tenantId}:{JsonSerializer.Serialize(request)}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<PagedResult<DoctorResponse>>(cached!)!;
            }
        }

        var result = await _doctorRepository.SearchAsync(request, tenantId);

        var response = new PagedResult<DoctorResponse>
        {
            Items = result.Items.Select(MapToResponse).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };

        if (_cache != null)
        {
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(5));
        }

        return response;
    }

    public async Task<Guid> AddSpecializationAsync(Guid doctorId, AddSpecializationRequest request, Guid tenantId, Guid createdBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, tenantId);
        if (doctor == null)
        {
            throw new Exception("Doctor not found");
        }

        var specialization = new DoctorSpecialization
        {
            DoctorId = doctorId,
            SpecializationName = request.SpecializationName,
            CertificationBody = request.CertificationBody,
            CertificationDate = request.CertificationDate,
            IsPrimary = request.IsPrimary,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        return await _specializationRepository.CreateAsync(specialization);
    }

    public async Task<Guid> AddQualificationAsync(Guid doctorId, AddQualificationRequest request, Guid tenantId, Guid createdBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, tenantId);
        if (doctor == null)
        {
            throw new Exception("Doctor not found");
        }

        var qualification = new DoctorQualification
        {
            DoctorId = doctorId,
            DegreeName = request.DegreeName,
            Institution = request.Institution,
            University = request.University,
            YearOfCompletion = request.YearOfCompletion,
            Country = request.Country,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        return await _qualificationRepository.CreateAsync(qualification);
    }

    public async Task<Guid> AddAvailabilityAsync(Guid doctorId, AddAvailabilityRequest request, Guid tenantId, Guid createdBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, tenantId);
        if (doctor == null)
        {
            throw new Exception("Doctor not found");
        }

        if (await _availabilityRepository.HasOverlappingAvailabilityAsync(doctorId, request.DayOfWeek, request.StartTime, request.EndTime, tenantId))
        {
            throw new Exception("Overlapping availability exists for this time slot");
        }

        var availability = new DoctorAvailability
        {
            DoctorId = doctorId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            IsAvailable = true,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        var id = await _availabilityRepository.CreateAsync(availability);

        _eventBus?.Publish(new DoctorAvailabilityUpdatedEvent
        {
            TenantId = tenantId,
            DoctorId = doctorId,
            DoctorCode = doctor.DoctorCode,
            DayOfWeek = request.DayOfWeek
        });

        return id;
    }

    public async Task<Guid> AddLeaveAsync(Guid doctorId, AddLeaveRequest request, Guid tenantId, Guid createdBy)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, tenantId);
        if (doctor == null)
        {
            throw new Exception("Doctor not found");
        }

        if (await _leaveRepository.HasOverlappingLeaveAsync(doctorId, request.StartDate, request.EndDate, tenantId))
        {
            throw new Exception("Overlapping leave exists for this date range");
        }

        var leave = new DoctorLeave
        {
            DoctorId = doctorId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            LeaveType = request.LeaveType,
            Reason = request.Reason,
            Status = "Pending",
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        return await _leaveRepository.CreateAsync(leave);
    }

    public async Task<IEnumerable<AvailabilityResponse>> GetDoctorAvailabilityAsync(Guid doctorId, Guid tenantId)
    {
        var availabilities = await _availabilityRepository.GetByDoctorIdAsync(doctorId, tenantId);
        return availabilities.Select(a => new AvailabilityResponse
        {
            Id = a.Id,
            DayOfWeek = a.DayOfWeek,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            SlotDurationMinutes = a.SlotDurationMinutes,
            IsAvailable = a.IsAvailable
        });
    }

    private static DoctorResponse MapToResponse(Doctor doctor)
    {
        return new DoctorResponse
        {
            Id = doctor.Id,
            DoctorCode = doctor.DoctorCode,
            FirstName = doctor.FirstName,
            MiddleName = doctor.MiddleName,
            LastName = doctor.LastName,
            DateOfBirth = doctor.DateOfBirth,
            Gender = doctor.Gender,
            MobileNumber = doctor.MobileNumber,
            Email = doctor.Email,
            LicenseNumber = doctor.LicenseNumber,
            ExperienceYears = doctor.ExperienceYears,
            Department = doctor.Department,
            ConsultationFee = doctor.ConsultationFee,
            IsActive = doctor.IsActive,
            CreatedAt = doctor.CreatedAt
        };
    }
}
