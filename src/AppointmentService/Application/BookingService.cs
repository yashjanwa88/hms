using AppointmentService.Application;
using AppointmentService.DTOs;
using AppointmentService.Integrations;
using AppointmentService.Repositories;

namespace AppointmentService.Application;

public interface IBookingService
{
    Task<List<DoctorForBookingResponse>> GetDoctorsForBookingAsync(string? specialization, Guid tenantId, string token);
    Task<DateValidationResponse> ValidateAppointmentDateAsync(Guid doctorId, DateTime date, Guid tenantId, string token);
    Task<AvailableSlotResponse> GetAvailableSlotsAsync(Guid doctorId, DateTime date, Guid tenantId, string token);
    Task<AppointmentResponse> BookAppointmentAsync(BookAppointmentRequest request, Guid tenantId, string tenantCode, Guid userId, string token);
}

public class BookingService : IBookingService
{
    private readonly IDoctorServiceClient _doctorClient;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IAppointmentService _appointmentService;

    public BookingService(IDoctorServiceClient doctorClient, IAppointmentRepository appointmentRepository, IAppointmentService appointmentService)
    {
        _doctorClient = doctorClient;
        _appointmentRepository = appointmentRepository;
        _appointmentService = appointmentService;
    }

    public async Task<List<DoctorForBookingResponse>> GetDoctorsForBookingAsync(string? specialization, Guid tenantId, string token)
    {
        try
        {
            var doctors = await _doctorClient.SearchDoctorsAsync(specialization, tenantId, token);
            return doctors.Select(d => new DoctorForBookingResponse
            {
                Id = d.Id,
                FullName = d.FullName,
                Department = d.Department,
                Specializations = d.Specializations,
                ConsultationFee = d.ConsultationFee,
                MaxPatientsPerDay = d.MaxPatientsPerDay
            }).ToList();
        }
        catch
        {
            return new List<DoctorForBookingResponse>();
        }
    }

    public async Task<DateValidationResponse> ValidateAppointmentDateAsync(Guid doctorId, DateTime date, Guid tenantId, string token)
    {
        if (date.Date < DateTime.UtcNow.Date)
        {
            return new DateValidationResponse
            {
                IsValid = false,
                IsPastDate = true,
                Message = "Cannot book appointments for past dates"
            };
        }

        var doctor = await _doctorClient.GetDoctorAsync(doctorId, tenantId, token);
        if (doctor == null)
        {
            return new DateValidationResponse
            {
                IsValid = false,
                Message = "Doctor not found"
            };
        }

        var availabilities = await _doctorClient.GetDoctorAvailabilityAsync(doctorId, tenantId, token);
        var dayOfWeek = date.DayOfWeek.ToString();
        var dayAvailability = availabilities.FirstOrDefault(a => a.DayOfWeek.Equals(dayOfWeek, StringComparison.OrdinalIgnoreCase));
        
        if (dayAvailability == null)
        {
            return new DateValidationResponse
            {
                IsValid = false,
                IsDoctorAvailable = false,
                Message = "Doctor is not available on this day"
            };
        }

        var appointmentCount = await _appointmentRepository.GetDoctorAppointmentCountForDateAsync(doctorId, date, tenantId);
        
        if (appointmentCount >= doctor.MaxPatientsPerDay)
        {
            return new DateValidationResponse
            {
                IsValid = false,
                HasReachedDailyLimit = true,
                CurrentAppointmentCount = appointmentCount,
                MaxAppointmentsAllowed = doctor.MaxPatientsPerDay,
                Message = $"Doctor has reached maximum appointments limit ({doctor.MaxPatientsPerDay}) for this date"
            };
        }

        return new DateValidationResponse
        {
            IsValid = true,
            IsDoctorAvailable = true,
            CurrentAppointmentCount = appointmentCount,
            MaxAppointmentsAllowed = doctor.MaxPatientsPerDay,
            Message = "Date is valid for booking"
        };
    }

    public async Task<AvailableSlotResponse> GetAvailableSlotsAsync(Guid doctorId, DateTime date, Guid tenantId, string token)
    {
        return await _appointmentService.GetAvailableSlotsAsync(new AvailableSlotRequest
        {
            DoctorId = doctorId,
            Date = date
        }, tenantId, token);
    }

    public async Task<AppointmentResponse> BookAppointmentAsync(BookAppointmentRequest request, Guid tenantId, string tenantCode, Guid userId, string token)
    {
        var createRequest = new CreateAppointmentRequest
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentDate = request.AppointmentDate,
            StartTime = TimeSpan.Parse(request.StartTime),
            EndTime = TimeSpan.Parse(request.EndTime),
            AppointmentType = request.AppointmentType,
            Reason = request.Reason,
            Notes = request.Notes,
            SendNotification = request.SendNotification
        };

        return await _appointmentService.CreateAppointmentAsync(createRequest, tenantId, tenantCode, userId, token);
    }
}