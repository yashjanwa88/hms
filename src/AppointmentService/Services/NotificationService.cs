using AppointmentService.Events;
using Shared.EventBus.Interfaces;

namespace AppointmentService.Services;

public interface INotificationService
{
    Task SendAppointmentConfirmationAsync(Guid appointmentId, Guid patientId, Guid doctorId, DateTime appointmentDate, TimeSpan startTime, Guid tenantId);
}

public class NotificationService : INotificationService
{
    private readonly IEventBus _eventBus;

    public NotificationService(IEventBus eventBus)
    {
        _eventBus = eventBus;
    }

    public async Task SendAppointmentConfirmationAsync(Guid appointmentId, Guid patientId, Guid doctorId, DateTime appointmentDate, TimeSpan startTime, Guid tenantId)
    {
        _eventBus.Publish(new AppointmentNotificationEvent
        {
            TenantId = tenantId,
            AppointmentId = appointmentId,
            PatientId = patientId,
            DoctorId = doctorId,
            AppointmentDate = appointmentDate,
            StartTime = startTime,
            NotificationType = "SMS_EMAIL_CONFIRMATION"
        });
    }
}