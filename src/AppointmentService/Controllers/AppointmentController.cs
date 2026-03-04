using AppointmentService.Application;
using AppointmentService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace AppointmentService.Controllers;

[ApiController]
[Route("api/appointment/v1/appointments")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpPost]
    [Authorize(Roles = "Receptionist,Doctor,Nurse,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<AppointmentResponse>>> CreateAppointment(
        [FromBody] CreateAppointmentRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-Tenant-Code")] string tenantCode,
        [FromHeader(Name = "X-User-Id")] Guid userId,
        [FromHeader(Name = "Authorization")] string authorization)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var result = await _appointmentService.CreateAppointmentAsync(request, tenantId, tenantCode, userId, token);
            return Ok(ApiResponse<AppointmentResponse>.SuccessResponse(result, "Appointment created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<AppointmentResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Doctor,Nurse,Receptionist,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<AppointmentResponse>>> GetAppointment(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "Authorization")] string authorization)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var result = await _appointmentService.GetAppointmentByIdAsync(id, tenantId, token);
            if (result == null)
            {
                return NotFound(ApiResponse<AppointmentResponse>.ErrorResponse("Appointment not found"));
            }
            return Ok(ApiResponse<AppointmentResponse>.SuccessResponse(result, "Appointment retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<AppointmentResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}/reschedule")]
    [Authorize(Roles = "Receptionist,Doctor,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> RescheduleAppointment(
        Guid id,
        [FromBody] RescheduleAppointmentRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId,
        [FromHeader(Name = "Authorization")] string authorization)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var result = await _appointmentService.RescheduleAppointmentAsync(id, request, tenantId, userId, token);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Appointment not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Appointment rescheduled successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Receptionist,Doctor,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelAppointment(
        Guid id,
        [FromBody] CancelAppointmentRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _appointmentService.CancelAppointmentAsync(id, request, tenantId, userId);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Appointment not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Appointment cancelled successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}/checkin")]
    [Authorize(Roles = "Receptionist,Nurse,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckInAppointment(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _appointmentService.CheckInAppointmentAsync(id, tenantId, userId);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Appointment not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Patient checked in successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}/complete")]
    [Authorize(Roles = "Doctor,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> CompleteAppointment(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _appointmentService.CompleteAppointmentAsync(id, tenantId, userId);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Appointment not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Appointment completed successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("search")]
    [Authorize(Roles = "Doctor,Nurse,Receptionist,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<PagedResult<AppointmentResponse>>>> SearchAppointments(
        [FromQuery] AppointmentSearchRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "Authorization")] string authorization)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var result = await _appointmentService.SearchAppointmentsAsync(request, tenantId, token);
            return Ok(ApiResponse<PagedResult<AppointmentResponse>>.SuccessResponse(result, "Appointments retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PagedResult<AppointmentResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("available-slots")]
    [Authorize(Roles = "Doctor,Nurse,Receptionist,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<AvailableSlotResponse>>> GetAvailableSlots(
        [FromQuery] AvailableSlotRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "Authorization")] string authorization)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var result = await _appointmentService.GetAvailableSlotsAsync(request, tenantId, token);
            return Ok(ApiResponse<AvailableSlotResponse>.SuccessResponse(result, "Available slots retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<AvailableSlotResponse>.ErrorResponse(ex.Message));
        }
    }
}

[ApiController]
[Route("api/appointment/v1/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "Healthy", service = "AppointmentService", timestamp = DateTime.UtcNow });
    }
}
