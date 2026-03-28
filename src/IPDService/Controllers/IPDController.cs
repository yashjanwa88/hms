using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IPDService.Application;
using IPDService.DTOs;
using IPDService.Domain;
using Shared.Common.Models;
using System.Security.Claims;

namespace IPDService.Controllers;

[ApiController]
[Route("api/ipd/v1")]
[Authorize]
public class IPDController : ControllerBase
{
    private readonly IIPDService _ipdService;

    public IPDController(IIPDService ipdService)
    {
        _ipdService = ipdService;
    }

    private Guid GetTenantId()
    {
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) && Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return tenantId;
        }
        throw new Exception("Tenant ID not found in headers");
    }

    private Guid GetUserId()
    {
        return Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
    }

    [HttpPost("wards")]
    public async Task<ActionResult<ApiResponse<Ward>>> CreateWard([FromBody] CreateWardRequest request)
    {
        try
        {
            var result = await _ipdService.CreateWardAsync(request, GetTenantId(), GetUserId());
            return Ok(ApiResponse<Ward>.SuccessResponse(result, "Ward created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Ward>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("wards")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Ward>>>> GetAllWards()
    {
        try
        {
            var result = await _ipdService.GetAllWardsAsync(GetTenantId());
            return Ok(ApiResponse<IEnumerable<Ward>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Ward>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("beds")]
    public async Task<ActionResult<ApiResponse<Bed>>> CreateBed([FromBody] CreateBedRequest request)
    {
        try
        {
            var result = await _ipdService.CreateBedAsync(request, GetTenantId(), GetUserId());
            return Ok(ApiResponse<Bed>.SuccessResponse(result, "Bed created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Bed>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("wards/{wardId}/beds")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Bed>>>> GetBedsByWard(Guid wardId)
    {
        try
        {
            var result = await _ipdService.GetBedsByWardAsync(GetTenantId(), wardId);
            return Ok(ApiResponse<IEnumerable<Bed>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Bed>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("admissions")]
    public async Task<ActionResult<ApiResponse<Admission>>> AdmitPatient([FromBody] AdmitPatientRequest request)
    {
        try
        {
            var result = await _ipdService.AdmitPatientAsync(request, GetTenantId(), GetUserId());
            return Ok(ApiResponse<Admission>.SuccessResponse(result, "Patient admitted successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Admission>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("admissions/active")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Admission>>>> GetActiveAdmissions()
    {
        try
        {
            var result = await _ipdService.GetActiveAdmissionsAsync(GetTenantId());
            return Ok(ApiResponse<IEnumerable<Admission>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Admission>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("admissions/{id}/discharge")]
    public async Task<ActionResult<ApiResponse<Admission>>> DischargePatient(Guid id, [FromBody] DischargePatientRequest request)
    {
        try
        {
            var result = await _ipdService.DischargePatientAsync(id, request, GetTenantId(), GetUserId());
            return Ok(ApiResponse<Admission>.SuccessResponse(result, "Patient discharged successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Admission>.ErrorResponse(ex.Message));
        }
    }
}
