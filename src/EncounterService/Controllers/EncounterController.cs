using EncounterService.Application;
using EncounterService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace EncounterService.Controllers;

[ApiController]
[Route("api/encounters")]
public class EncounterController : ControllerBase
{
    private readonly IEncounterAppService _encounterService;

    public EncounterController(IEncounterAppService encounterService)
    {
        _encounterService = encounterService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateEncounter([FromBody] CreateEncounterRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());
        var tenantCode = "HOSP"; // TODO: Get from tenant service

        var encounterId = await _encounterService.CreateEncounterAsync(request, tenantId, userId, tenantCode);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Encounter created successfully",
            Data = new { Id = encounterId }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEncounterById(Guid id)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var encounter = await _encounterService.GetEncounterByIdAsync(id, tenantId);

        if (encounter == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Encounter not found"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = encounter
        });
    }

    [HttpGet("number/{encounterNumber}")]
    public async Task<IActionResult> GetEncounterByNumber(string encounterNumber)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var encounter = await _encounterService.GetEncounterByNumberAsync(encounterNumber, tenantId);

        if (encounter == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Encounter not found"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = encounter
        });
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchEncounters([FromQuery] EncounterSearchRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _encounterService.SearchEncountersAsync(request, tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = result
        });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateEncounterStatus(Guid id, [FromBody] UpdateEncounterStatusRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        var success = await _encounterService.UpdateEncounterStatusAsync(id, request.Status, tenantId, userId);

        if (!success)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update encounter status"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Encounter status updated successfully"
        });
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetEncounterCount([FromQuery] Guid patientId)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var count = await _encounterService.GetCountByPatientAsync(patientId, tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = count
        });
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "EncounterService" });
    }
}
