using DoctorService.Application;
using DoctorService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace DoctorService.Controllers;

[ApiController]
[Route("api/doctor/v1/doctors")]
[Authorize]
public class DoctorController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpPost]
    [RequirePermission("doctor.create")]
    public async Task<ActionResult<ApiResponse<DoctorResponse>>> CreateDoctor(
        [FromBody] CreateDoctorRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
            var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

            var result = await _doctorService.CreateDoctorAsync(request, tenantId, userId);
            return Ok(ApiResponse<DoctorResponse>.SuccessResponse(result, "Doctor created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<DoctorResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}")]
    [RequirePermission("doctor.view")]
    public async Task<ActionResult<ApiResponse<DoctorResponse>>> GetDoctor(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var result = await _doctorService.GetDoctorByIdAsync(id, tenantId);
            if (result == null)
            {
                return NotFound(ApiResponse<DoctorResponse>.ErrorResponse("Doctor not found"));
            }
            return Ok(ApiResponse<DoctorResponse>.SuccessResponse(result, "Doctor retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<DoctorResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("doctor.update")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateDoctor(
        Guid id,
        [FromBody] UpdateDoctorRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.UpdateDoctorAsync(id, request, tenantId, userId);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Doctor not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Doctor updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    [RequirePermission("doctor.delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteDoctor(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.DeleteDoctorAsync(id, tenantId, userId);
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Doctor not found"));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Doctor deleted successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet]
    [RequirePermission("doctor.view")]
    public async Task<ActionResult<ApiResponse<PagedResult<DoctorResponse>>>> SearchDoctors(
        [FromQuery] DoctorSearchRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var result = await _doctorService.SearchDoctorsAsync(request, tenantId);
            return Ok(ApiResponse<PagedResult<DoctorResponse>>.SuccessResponse(result, "Doctors retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PagedResult<DoctorResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/specializations")]
    [Authorize(Roles = "HospitalAdmin,SuperAdmin,Admin")]
    public async Task<ActionResult<ApiResponse<Guid>>> AddSpecialization(
        Guid id,
        [FromBody] AddSpecializationRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.AddSpecializationAsync(id, request, tenantId, userId);
            return Ok(ApiResponse<Guid>.SuccessResponse(result, "Specialization added successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Guid>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/qualifications")]
    [Authorize(Roles = "HospitalAdmin,SuperAdmin,Admin")]
    public async Task<ActionResult<ApiResponse<Guid>>> AddQualification(
        Guid id,
        [FromBody] AddQualificationRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.AddQualificationAsync(id, request, tenantId, userId);
            return Ok(ApiResponse<Guid>.SuccessResponse(result, "Qualification added successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Guid>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/availability")]
    [Authorize(Roles = "Doctor,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<Guid>>> AddAvailability(
        Guid id,
        [FromBody] AddAvailabilityRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.AddAvailabilityAsync(id, request, tenantId, userId);
            return Ok(ApiResponse<Guid>.SuccessResponse(result, "Availability added successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Guid>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}/availability")]
    [Authorize(Roles = "Doctor,Nurse,Receptionist,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AvailabilityResponse>>>> GetAvailability(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var result = await _doctorService.GetDoctorAvailabilityAsync(id, tenantId);
            return Ok(ApiResponse<IEnumerable<AvailabilityResponse>>.SuccessResponse(result, "Availability retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<AvailabilityResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/leave")]
    [Authorize(Roles = "Doctor,HospitalAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<Guid>>> AddLeave(
        Guid id,
        [FromBody] AddLeaveRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _doctorService.AddLeaveAsync(id, request, tenantId, userId);
            return Ok(ApiResponse<Guid>.SuccessResponse(result, "Leave added successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Guid>.ErrorResponse(ex.Message));
        }
    }
}

[ApiController]
[Route("api/doctor/v1/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "Healthy", service = "DoctorService", timestamp = DateTime.UtcNow });
    }
}
