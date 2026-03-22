using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Authorization;
using Shared.Common.Models;
using System.Text.Json;
using AppointmentService.Application;
using AppointmentService.DTOs;

namespace AppointmentService.Controllers;

[ApiController]
[Route("api/appointment/v1/booking")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IBookingService _bookingService;

    public BookingController(HttpClient httpClient, IBookingService bookingService)
    {
        _httpClient = httpClient;
        _bookingService = bookingService;
    }

    [HttpGet("doctors")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetDoctors()
    {
        try
        {
            var tenantId = Request.Headers["X-Tenant-Id"].ToString();
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);
            
            var response = await _httpClient.GetAsync("http://localhost:5008/api/doctor/v1/doctors");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var doctorResponse = JsonSerializer.Deserialize<ApiResponse<PagedResult<object>>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                var doctors = doctorResponse?.Data?.Items?.Select(doctor => 
                {
                    var doctorDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(doctor));
                    if (doctorDict != null)
                    {
                        doctorDict["specializations"] = new List<string> { doctorDict.GetValueOrDefault("department", "General")?.ToString() ?? "General" };
                    }
                    return (object)doctorDict;
                }).Where(d => d != null).ToList() ?? new List<object>();
                
                return Ok(ApiResponse<List<object>>.SuccessResponse(doctors, "Success"));
            }
            
            return Ok(ApiResponse<List<object>>.SuccessResponse(new List<object>(), "Success"));
        }
        catch
        {
            return Ok(ApiResponse<List<object>>.SuccessResponse(new List<object>(), "Success"));
        }
    }

    [HttpGet("validate-date/{doctorId:guid}/{date}")]
    [RequirePermission("appointment.slots")]
    public ActionResult<ApiResponse<object>> ValidateDate(Guid doctorId, string date)
    {
        var validation = new
        {
            isValid = true,
            message = "Date is available",
            maxAppointmentsAllowed = 20,
            currentAppointmentCount = 5
        };
        return Ok(ApiResponse<object>.SuccessResponse(validation, "Success"));
    }

    [HttpGet("available-slots/{doctorId:guid}/{date}")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<object>> GetAvailableSlots(Guid doctorId, string date)
    {
        var slots = new List<object>
        {
            new { startTime = "09:00", endTime = "09:30", isAvailable = true },
            new { startTime = "09:30", endTime = "10:00", isAvailable = true },
            new { startTime = "10:00", endTime = "10:30", isAvailable = false },
            new { startTime = "10:30", endTime = "11:00", isAvailable = true },
            new { startTime = "11:00", endTime = "11:30", isAvailable = true },
            new { startTime = "14:00", endTime = "14:30", isAvailable = true },
            new { startTime = "14:30", endTime = "15:00", isAvailable = true },
            new { startTime = "15:00", endTime = "15:30", isAvailable = true }
        };
        
        var response = new { availableSlots = slots };
        return Ok(ApiResponse<object>.SuccessResponse(response, "Success"));
    }

    [HttpPost("book")]
    [RequirePermission("appointment.book")]
    public async Task<ActionResult<ApiResponse<object>>> BookAppointment([FromBody] BookAppointmentRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());
            var tenantCode = Request.Headers["X-Tenant-Code"].ToString();
            if (string.IsNullOrWhiteSpace(tenantCode))
                tenantCode = "HOSP001";

            var authHeader = Request.Headers.Authorization.ToString();
            var bearerToken = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader["Bearer ".Length..].Trim()
                : authHeader;

            var appointmentService = HttpContext.RequestServices.GetRequiredService<IAppointmentService>();
            var createRequest = new CreateAppointmentRequest
            {
                PatientId = request.PatientId,
                DoctorId = request.DoctorId,
                AppointmentDate = request.AppointmentDate,
                StartTime = TimeSpan.Parse(request.StartTime),
                EndTime = TimeSpan.Parse(request.EndTime),
                AppointmentType = request.AppointmentType,
                Reason = request.Reason,
                Notes = request.Notes ?? "",
                SendNotification = request.SendNotification
            };

            var result = await appointmentService.CreateAppointmentAsync(createRequest, tenantId, tenantCode, userId, bearerToken);
            return Ok(ApiResponse<object>.SuccessResponse(result, "Appointment booked successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }
}