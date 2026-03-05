using VisitService.Domain;
using VisitService.DTOs;
using VisitService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Events;
using Shared.EventBus.Interfaces;

namespace VisitService.Application;

public interface IVisitService
{
    Task<VisitResponse> CreateVisitAsync(CreateVisitRequest request, Guid tenantId, string tenantCode, Guid userId);
    Task<VisitResponse> CreateEmergencyVisitAsync(EmergencyVisitRequest request, Guid tenantId, string tenantCode, Guid userId);
    Task<VisitResponse?> GetVisitByIdAsync(Guid id, Guid tenantId);
    Task<VisitResponse?> GetVisitByNumberAsync(string visitNumber, Guid tenantId);
    Task<bool> UpdateVisitAsync(Guid id, UpdateVisitRequest request, Guid tenantId, Guid userId);
    Task<bool> CheckInVisitAsync(Guid id, Guid tenantId, Guid userId);
    Task<bool> CheckOutVisitAsync(Guid id, Guid tenantId, Guid userId);
    Task<PagedResult<VisitResponse>> SearchVisitsAsync(VisitSearchRequest request, Guid tenantId);
    Task<List<VisitResponse>> GetPatientVisitHistoryAsync(Guid patientId, Guid tenantId);
    Task<bool> ConvertToIPDAsync(IPDConversionRequest request, Guid tenantId, Guid userId);
    Task<VisitStatsResponse> GetStatsAsync(Guid tenantId);
    Task<List<VisitResponse>> GetActiveVisitsAsync(Guid tenantId);
    Task<List<VisitTimelineResponse>> GetVisitTimelineAsync(Guid visitId, Guid tenantId);
}

public class VisitApplicationService : IVisitService
{
    private readonly IVisitRepository _visitRepository;
    private readonly IVisitTimelineRepository _timelineRepository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<VisitApplicationService> _logger;

    public VisitApplicationService(
        IVisitRepository visitRepository,
        IVisitTimelineRepository timelineRepository,
        IEventBus eventBus,
        ILogger<VisitApplicationService> logger)
    {
        _visitRepository = visitRepository;
        _timelineRepository = timelineRepository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<VisitResponse> CreateVisitAsync(CreateVisitRequest request, Guid tenantId, string tenantCode, Guid userId)
    {
        var visitNumber = await _visitRepository.GenerateVisitNumberAsync(tenantId, tenantCode, request.VisitType);
        
        var visit = new Visit
        {
            TenantId = tenantId,
            VisitNumber = visitNumber,
            PatientId = request.PatientId,
            PatientUHID = request.PatientUHID,
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            DoctorName = request.DoctorName,
            Department = request.Department,
            VisitType = request.VisitType,
            Priority = request.Priority,
            ChiefComplaint = request.ChiefComplaint,
            Symptoms = request.Symptoms,
            IsEmergency = request.IsEmergency,
            ConsultationFee = request.ConsultationFee,
            PaymentStatus = "Pending",
            CreatedBy = userId
        };

        var visitId = await _visitRepository.CreateAsync(visit);
        visit.Id = visitId;

        // Create timeline entry
        await CreateTimelineEntry(visitId, "VisitCreated", "Visit registered", tenantId, userId, request.DoctorName);

        // Publish event
        _eventBus.Publish(new VisitCreatedEvent
        {
            VisitId = visitId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            VisitType = request.VisitType,
            TenantId = tenantId
        });

        return MapToResponse(visit);
    }

    public async Task<VisitResponse> CreateEmergencyVisitAsync(EmergencyVisitRequest request, Guid tenantId, string tenantCode, Guid userId)
    {
        var visitNumber = await _visitRepository.GenerateVisitNumberAsync(tenantId, tenantCode, "Emergency");
        
        var visit = new Visit
        {
            TenantId = tenantId,
            VisitNumber = visitNumber,
            PatientId = request.PatientId,
            PatientUHID = request.PatientUHID,
            DoctorId = request.DoctorId,
            DoctorName = request.DoctorName,
            Department = "Emergency",
            VisitType = "Emergency",
            Priority = request.Priority,
            ChiefComplaint = request.ChiefComplaint,
            Symptoms = request.Symptoms,
            VitalSigns = request.VitalSigns,
            IsEmergency = true,
            Status = "InProgress", // Emergency visits start immediately
            CheckInTime = DateTime.UtcNow,
            CreatedBy = userId
        };

        var visitId = await _visitRepository.CreateAsync(visit);
        visit.Id = visitId;

        // Create timeline entries
        await CreateTimelineEntry(visitId, "EmergencyVisit", "Emergency visit created", tenantId, userId, request.DoctorName);
        await CreateTimelineEntry(visitId, "CheckIn", "Patient checked in for emergency", tenantId, userId, request.DoctorName);

        return MapToResponse(visit);
    }

    public async Task<VisitResponse?> GetVisitByIdAsync(Guid id, Guid tenantId)
    {
        var visit = await _visitRepository.GetByIdAsync(id, tenantId);
        return visit != null ? MapToResponse(visit) : null;
    }

    public async Task<VisitResponse?> GetVisitByNumberAsync(string visitNumber, Guid tenantId)
    {
        var visit = await _visitRepository.GetByVisitNumberAsync(visitNumber, tenantId);
        return visit != null ? MapToResponse(visit) : null;
    }

    public async Task<bool> UpdateVisitAsync(Guid id, UpdateVisitRequest request, Guid tenantId, Guid userId)
    {
        var visit = await _visitRepository.GetByIdAsync(id, tenantId);
        if (visit == null) return false;

        visit.ChiefComplaint = request.ChiefComplaint ?? visit.ChiefComplaint;
        visit.Symptoms = request.Symptoms ?? visit.Symptoms;
        visit.VitalSigns = request.VitalSigns ?? visit.VitalSigns;
        visit.Diagnosis = request.Diagnosis ?? visit.Diagnosis;
        visit.Treatment = request.Treatment ?? visit.Treatment;
        visit.Prescription = request.Prescription ?? visit.Prescription;
        visit.Instructions = request.Instructions ?? visit.Instructions;
        visit.FollowUpDate = request.FollowUpDate ?? visit.FollowUpDate;
        visit.Notes = request.Notes ?? visit.Notes;
        visit.UpdatedBy = userId;

        var result = await _visitRepository.UpdateAsync(visit);
        
        if (result)
        {
            await CreateTimelineEntry(id, "VisitUpdated", "Visit details updated", tenantId, userId, visit.DoctorName);
        }

        return result;
    }

    public async Task<bool> CheckInVisitAsync(Guid id, Guid tenantId, Guid userId)
    {
        var result = await _visitRepository.CheckInAsync(id, tenantId, userId);
        
        if (result)
        {
            var visit = await _visitRepository.GetByIdAsync(id, tenantId);
            await CreateTimelineEntry(id, "CheckIn", "Patient checked in", tenantId, userId, visit?.DoctorName);
        }

        return result;
    }

    public async Task<bool> CheckOutVisitAsync(Guid id, Guid tenantId, Guid userId)
    {
        var result = await _visitRepository.CheckOutAsync(id, tenantId, userId);
        
        if (result)
        {
            var visit = await _visitRepository.GetByIdAsync(id, tenantId);
            await CreateTimelineEntry(id, "CheckOut", "Patient checked out", tenantId, userId, visit?.DoctorName);
            
            // Publish event
            _eventBus.Publish(new VisitCompletedEvent
            {
                VisitId = id,
                PatientId = visit?.PatientId ?? Guid.Empty,
                TenantId = tenantId
            });
        }

        return result;
    }

    public async Task<PagedResult<VisitResponse>> SearchVisitsAsync(VisitSearchRequest request, Guid tenantId)
    {
        var result = await _visitRepository.SearchAsync(request, tenantId);
        
        return new PagedResult<VisitResponse>
        {
            Items = result.Items.Select(MapToResponse).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<List<VisitResponse>> GetPatientVisitHistoryAsync(Guid patientId, Guid tenantId)
    {
        var visits = await _visitRepository.GetPatientVisitHistoryAsync(patientId, tenantId);
        return visits.Select(MapToResponse).ToList();
    }

    public async Task<bool> ConvertToIPDAsync(IPDConversionRequest request, Guid tenantId, Guid userId)
    {
        // This would typically call IPD service to create admission
        var ipdAdmissionId = Guid.NewGuid(); // Placeholder
        
        var result = await _visitRepository.ConvertToIPDAsync(request.VisitId, ipdAdmissionId, tenantId, userId);
        
        if (result)
        {
            var visit = await _visitRepository.GetByIdAsync(request.VisitId, tenantId);
            await CreateTimelineEntry(request.VisitId, "IPDConversion", $"Converted to IPD: {request.Reason}", tenantId, userId, visit?.DoctorName);
            
            // Publish event
            _eventBus.Publish(new VisitConvertedToIPDEvent
            {
                VisitId = request.VisitId,
                PatientId = visit?.PatientId ?? Guid.Empty,
                IPDAdmissionId = ipdAdmissionId,
                TenantId = tenantId
            });
        }

        return result;
    }

    public async Task<VisitStatsResponse> GetStatsAsync(Guid tenantId)
    {
        return await _visitRepository.GetStatsAsync(tenantId);
    }

    public async Task<List<VisitResponse>> GetActiveVisitsAsync(Guid tenantId)
    {
        var visits = await _visitRepository.GetActiveVisitsAsync(tenantId);
        return visits.Select(MapToResponse).ToList();
    }

    public async Task<List<VisitTimelineResponse>> GetVisitTimelineAsync(Guid visitId, Guid tenantId)
    {
        var timeline = await _timelineRepository.GetByVisitIdAsync(visitId, tenantId);
        return timeline.Select(t => new VisitTimelineResponse
        {
            Id = t.Id,
            EventType = t.EventType,
            EventDescription = t.EventDescription,
            EventDateTime = t.EventDateTime,
            PerformedByName = t.PerformedByName,
            EventData = t.EventData
        }).ToList();
    }

    private async Task CreateTimelineEntry(Guid visitId, string eventType, string description, Guid tenantId, Guid userId, string? performedByName)
    {
        var timeline = new VisitTimeline
        {
            TenantId = tenantId,
            VisitId = visitId,
            EventType = eventType,
            EventDescription = description,
            PerformedBy = userId,
            PerformedByName = performedByName,
            CreatedBy = userId
        };

        await _timelineRepository.CreateAsync(timeline);
    }

    private static VisitResponse MapToResponse(Visit visit)
    {
        return new VisitResponse
        {
            Id = visit.Id,
            VisitNumber = visit.VisitNumber,
            PatientId = visit.PatientId,
            PatientUHID = visit.PatientUHID,
            AppointmentId = visit.AppointmentId,
            DoctorId = visit.DoctorId,
            DoctorName = visit.DoctorName,
            Department = visit.Department,
            VisitType = visit.VisitType,
            Priority = visit.Priority,
            Status = visit.Status,
            VisitDateTime = visit.VisitDateTime,
            CheckInTime = visit.CheckInTime,
            CheckOutTime = visit.CheckOutTime,
            ChiefComplaint = visit.ChiefComplaint,
            Symptoms = visit.Symptoms,
            VitalSigns = visit.VitalSigns,
            Diagnosis = visit.Diagnosis,
            Treatment = visit.Treatment,
            Prescription = visit.Prescription,
            Instructions = visit.Instructions,
            FollowUpDate = visit.FollowUpDate,
            IsEmergency = visit.IsEmergency,
            IsIPDConverted = visit.IsIPDConverted,
            IPDAdmissionId = visit.IPDAdmissionId,
            ConsultationFee = visit.ConsultationFee,
            PaymentStatus = visit.PaymentStatus,
            Notes = visit.Notes,
            CreatedAt = visit.CreatedAt
        };
    }
}