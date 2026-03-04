using AppointmentService.Domain;
using AppointmentService.DTOs;
using AppointmentService.Events;
using AppointmentService.Integrations;
using AppointmentService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace AppointmentService.Application;

public interface IAppointmentService
{
    Task<AppointmentResponse> CreateAppointmentAsync(CreateAppointmentRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token);
    Task<AppointmentResponse?> GetAppointmentByIdAsync(Guid id, Guid tenantId, string token);
    Task<bool> RescheduleAppointmentAsync(Guid id, RescheduleAppointmentRequest request, Guid tenantId, Guid updatedBy, string token);
    Task<bool> CancelAppointmentAsync(Guid id, CancelAppointmentRequest request, Guid tenantId, Guid cancelledBy);
    Task<bool> CheckInAppointmentAsync(Guid id, Guid tenantId, Guid checkedInBy);
    Task<bool> CompleteAppointmentAsync(Guid id, Guid tenantId, Guid completedBy);
    Task<PagedResult<AppointmentResponse>> SearchAppointmentsAsync(AppointmentSearchRequest request, Guid tenantId, string token);
    Task<AvailableSlotResponse> GetAvailableSlotsAsync(AvailableSlotRequest request, Guid tenantId, string token);
}

public class AppointmentAppService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IAppointmentStatusHistoryRepository _statusHistoryRepository;
    private readonly IAppointmentSlotLockRepository _slotLockRepository;
    private readonly IDoctorServiceClient _doctorClient;
    private readonly IPatientServiceClient _patientClient;
    private readonly IEventBus _eventBus;
    private readonly IDatabase? _cache;

    public AppointmentAppService(
        IAppointmentRepository appointmentRepository,
        IAppointmentStatusHistoryRepository statusHistoryRepository,
        IAppointmentSlotLockRepository slotLockRepository,
        IDoctorServiceClient doctorClient,
        IPatientServiceClient patientClient,
        IEventBus eventBus,
        IConnectionMultiplexer? redis = null)
    {
        _appointmentRepository = appointmentRepository;
        _statusHistoryRepository = statusHistoryRepository;
        _slotLockRepository = slotLockRepository;
        _doctorClient = doctorClient;
        _patientClient = patientClient;
        _eventBus = eventBus;
        _cache = redis?.GetDatabase();
    }

    public async Task<AppointmentResponse> CreateAppointmentAsync(CreateAppointmentRequest request, Guid tenantId, string tenantCode, Guid createdBy, string token)
    {
        // Validate patient exists
        var patient = await _patientClient.GetPatientAsync(request.PatientId, tenantId, token);
        if (patient == null)
        {
            throw new Exception("Patient not found");
        }

        // Validate doctor exists
        var doctor = await _doctorClient.GetDoctorAsync(request.DoctorId, tenantId, token);
        if (doctor == null)
        {
            throw new Exception("Doctor not found");
        }

        // Check for conflicting appointments
        if (await _appointmentRepository.HasConflictingAppointmentAsync(request.DoctorId, request.AppointmentDate, request.StartTime, request.EndTime, tenantId))
        {
            throw new Exception("Doctor already has an appointment at this time");
        }

        // Check if slot is locked
        if (await _slotLockRepository.IsSlotLockedAsync(request.DoctorId, request.AppointmentDate, request.StartTime, request.EndTime, tenantId))
        {
            throw new Exception("This time slot is currently being booked by another user");
        }

        var appointmentNumber = await _appointmentRepository.GenerateAppointmentNumberAsync(tenantId, tenantCode);

        var appointment = new Appointment
        {
            AppointmentNumber = appointmentNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentDate = request.AppointmentDate.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = "Scheduled",
            AppointmentType = request.AppointmentType,
            Reason = request.Reason,
            Notes = request.Notes,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _appointmentRepository.CreateAsync(appointment);

        await _statusHistoryRepository.CreateAsync(new AppointmentStatusHistory
        {
            AppointmentId = appointment.Id,
            FromStatus = "",
            ToStatus = "Scheduled",
            Reason = "Appointment created",
            ChangedBy = createdBy,
            ChangedAt = DateTime.UtcNow,
            TenantId = tenantId,
            CreatedBy = createdBy
        });

        _eventBus.Publish(new AppointmentCreatedEvent
        {
            TenantId = tenantId,
            AppointmentId = appointment.Id,
            AppointmentNumber = appointment.AppointmentNumber,
            PatientId = appointment.PatientId,
            DoctorId = appointment.DoctorId,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime
        });

        return new AppointmentResponse
        {
            Id = appointment.Id,
            AppointmentNumber = appointment.AppointmentNumber,
            PatientId = appointment.PatientId,
            PatientName = patient.FullName,
            DoctorId = appointment.DoctorId,
            DoctorName = doctor.FullName,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status,
            AppointmentType = appointment.AppointmentType,
            Reason = appointment.Reason,
            CreatedAt = appointment.CreatedAt
        };
    }

    public async Task<AppointmentResponse?> GetAppointmentByIdAsync(Guid id, Guid tenantId, string token)
    {
        var cacheKey = $"appointment:{tenantId}:{id}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<AppointmentResponse>(cached!);
            }
        }

        var appointment = await _appointmentRepository.GetByIdAsync(id, tenantId);
        if (appointment == null) return null;

        var patient = await _patientClient.GetPatientAsync(appointment.PatientId, tenantId, token);
        var doctor = await _doctorClient.GetDoctorAsync(appointment.DoctorId, tenantId, token);

        var response = new AppointmentResponse
        {
            Id = appointment.Id,
            AppointmentNumber = appointment.AppointmentNumber,
            PatientId = appointment.PatientId,
            PatientName = patient?.FullName ?? "Unknown",
            DoctorId = appointment.DoctorId,
            DoctorName = doctor?.FullName ?? "Unknown",
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status,
            AppointmentType = appointment.AppointmentType,
            Reason = appointment.Reason,
            CheckInTime = appointment.CheckInTime,
            CreatedAt = appointment.CreatedAt
        };

        if (_cache != null)
        {
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(10));
        }

        return response;
    }

    public async Task<bool> RescheduleAppointmentAsync(Guid id, RescheduleAppointmentRequest request, Guid tenantId, Guid updatedBy, string token)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, tenantId);
        if (appointment == null) return false;

        if (appointment.Status == "Cancelled" || appointment.Status == "Completed")
        {
            throw new Exception("Cannot reschedule a cancelled or completed appointment");
        }

        // Check for conflicting appointments
        if (await _appointmentRepository.HasConflictingAppointmentAsync(appointment.DoctorId, request.NewAppointmentDate, request.NewStartTime, request.NewEndTime, tenantId, id))
        {
            throw new Exception("Doctor already has an appointment at this time");
        }

        var oldStatus = appointment.Status;
        appointment.AppointmentDate = request.NewAppointmentDate.Date;
        appointment.StartTime = request.NewStartTime;
        appointment.EndTime = request.NewEndTime;
        appointment.Status = "Rescheduled";
        appointment.UpdatedBy = updatedBy;

        var result = await _appointmentRepository.UpdateAsync(appointment);

        if (result)
        {
            await _statusHistoryRepository.CreateAsync(new AppointmentStatusHistory
            {
                AppointmentId = appointment.Id,
                FromStatus = oldStatus,
                ToStatus = "Rescheduled",
                Reason = request.Reason,
                ChangedBy = updatedBy,
                ChangedAt = DateTime.UtcNow,
                TenantId = tenantId,
                CreatedBy = updatedBy
            });

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"appointment:{tenantId}:{id}");
            }
        }

        return result;
    }

    public async Task<bool> CancelAppointmentAsync(Guid id, CancelAppointmentRequest request, Guid tenantId, Guid cancelledBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, tenantId);
        if (appointment == null) return false;

        if (appointment.Status == "Cancelled")
        {
            throw new Exception("Appointment is already cancelled");
        }

        var oldStatus = appointment.Status;
        appointment.Status = "Cancelled";
        appointment.CancellationReason = request.CancellationReason;
        appointment.CancelledBy = cancelledBy;
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.UpdatedBy = cancelledBy;

        var result = await _appointmentRepository.UpdateAsync(appointment);

        if (result)
        {
            await _statusHistoryRepository.CreateAsync(new AppointmentStatusHistory
            {
                AppointmentId = appointment.Id,
                FromStatus = oldStatus,
                ToStatus = "Cancelled",
                Reason = request.CancellationReason,
                ChangedBy = cancelledBy,
                ChangedAt = DateTime.UtcNow,
                TenantId = tenantId,
                CreatedBy = cancelledBy
            });

            _eventBus.Publish(new AppointmentCancelledEvent
            {
                TenantId = tenantId,
                AppointmentId = appointment.Id,
                AppointmentNumber = appointment.AppointmentNumber,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId,
                CancellationReason = request.CancellationReason
            });

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"appointment:{tenantId}:{id}");
            }
        }

        return result;
    }

    public async Task<bool> CheckInAppointmentAsync(Guid id, Guid tenantId, Guid checkedInBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, tenantId);
        if (appointment == null) return false;

        if (appointment.Status != "Scheduled" && appointment.Status != "Rescheduled")
        {
            throw new Exception("Only scheduled appointments can be checked in");
        }

        var oldStatus = appointment.Status;
        appointment.Status = "CheckedIn";
        appointment.CheckInTime = DateTime.UtcNow;
        appointment.UpdatedBy = checkedInBy;

        var result = await _appointmentRepository.UpdateAsync(appointment);

        if (result)
        {
            await _statusHistoryRepository.CreateAsync(new AppointmentStatusHistory
            {
                AppointmentId = appointment.Id,
                FromStatus = oldStatus,
                ToStatus = "CheckedIn",
                Reason = "Patient checked in",
                ChangedBy = checkedInBy,
                ChangedAt = DateTime.UtcNow,
                TenantId = tenantId,
                CreatedBy = checkedInBy
            });

            _eventBus.Publish(new AppointmentCheckedInEvent
            {
                TenantId = tenantId,
                AppointmentId = appointment.Id,
                AppointmentNumber = appointment.AppointmentNumber,
                PatientId = appointment.PatientId,
                CheckInTime = appointment.CheckInTime.Value
            });

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"appointment:{tenantId}:{id}");
            }
        }

        return result;
    }

    public async Task<bool> CompleteAppointmentAsync(Guid id, Guid tenantId, Guid completedBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, tenantId);
        if (appointment == null) return false;

        if (appointment.Status == "Cancelled")
        {
            throw new Exception("Cannot complete a cancelled appointment");
        }

        var oldStatus = appointment.Status;
        appointment.Status = "Completed";
        appointment.CompletedTime = DateTime.UtcNow;
        appointment.UpdatedBy = completedBy;

        var result = await _appointmentRepository.UpdateAsync(appointment);

        if (result)
        {
            await _statusHistoryRepository.CreateAsync(new AppointmentStatusHistory
            {
                AppointmentId = appointment.Id,
                FromStatus = oldStatus,
                ToStatus = "Completed",
                Reason = "Appointment completed",
                ChangedBy = completedBy,
                ChangedAt = DateTime.UtcNow,
                TenantId = tenantId,
                CreatedBy = completedBy
            });

            _eventBus.Publish(new AppointmentCompletedEvent
            {
                TenantId = tenantId,
                AppointmentId = appointment.Id,
                AppointmentNumber = appointment.AppointmentNumber,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId
            });

            if (_cache != null)
            {
                await _cache.KeyDeleteAsync($"appointment:{tenantId}:{id}");
            }
        }

        return result;
    }

    public async Task<PagedResult<AppointmentResponse>> SearchAppointmentsAsync(AppointmentSearchRequest request, Guid tenantId, string token)
    {
        var result = await _appointmentRepository.SearchAsync(request, tenantId);

        var responses = new List<AppointmentResponse>();
        foreach (var appointment in result.Items)
        {
            var patient = await _patientClient.GetPatientAsync(appointment.PatientId, tenantId, token);
            var doctor = await _doctorClient.GetDoctorAsync(appointment.DoctorId, tenantId, token);

            responses.Add(new AppointmentResponse
            {
                Id = appointment.Id,
                AppointmentNumber = appointment.AppointmentNumber,
                PatientId = appointment.PatientId,
                PatientName = patient?.FullName ?? "Unknown",
                DoctorId = appointment.DoctorId,
                DoctorName = doctor?.FullName ?? "Unknown",
                AppointmentDate = appointment.AppointmentDate,
                StartTime = appointment.StartTime,
                EndTime = appointment.EndTime,
                Status = appointment.Status,
                AppointmentType = appointment.AppointmentType,
                Reason = appointment.Reason,
                CheckInTime = appointment.CheckInTime,
                CreatedAt = appointment.CreatedAt
            });
        }

        return new PagedResult<AppointmentResponse>
        {
            Items = responses,
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<AvailableSlotResponse> GetAvailableSlotsAsync(AvailableSlotRequest request, Guid tenantId, string token)
    {
        var availabilities = await _doctorClient.GetDoctorAvailabilityAsync(request.DoctorId, tenantId, token);
        var dayOfWeek = request.Date.DayOfWeek.ToString();
        
        var dayAvailability = availabilities.FirstOrDefault(a => a.DayOfWeek.Equals(dayOfWeek, StringComparison.OrdinalIgnoreCase));
        if (dayAvailability == null)
        {
            return new AvailableSlotResponse { Date = request.Date, AvailableSlots = new List<TimeSlot>() };
        }

        var bookedAppointments = await _appointmentRepository.GetDoctorAppointmentsForDateAsync(request.DoctorId, request.Date, tenantId);
        
        var slots = new List<TimeSlot>();
        var currentTime = dayAvailability.StartTime;
        var slotDuration = TimeSpan.FromMinutes(dayAvailability.SlotDurationMinutes);

        while (currentTime.Add(slotDuration) <= dayAvailability.EndTime)
        {
            var endTime = currentTime.Add(slotDuration);
            var isBooked = bookedAppointments.Any(a => 
                (a.StartTime <= currentTime && a.EndTime > currentTime) ||
                (a.StartTime < endTime && a.EndTime >= endTime) ||
                (a.StartTime >= currentTime && a.EndTime <= endTime));

            slots.Add(new TimeSlot
            {
                StartTime = currentTime,
                EndTime = endTime,
                IsAvailable = !isBooked
            });

            currentTime = endTime;
        }

        return new AvailableSlotResponse
        {
            Date = request.Date,
            AvailableSlots = slots
        };
    }
}
