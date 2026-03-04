using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using TenantService.Application;
using TenantService.Domain;
using TenantService.DTOs;

namespace TenantService.Controllers;

[ApiController]
[Route("api/tenant/v1/tenants")]
public class TenantController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Tenant>>> CreateTenant([FromBody] CreateTenantRequest request)
    {
        try
        {
            var result = await _tenantService.CreateTenantAsync(request);
            return Ok(ApiResponse<Tenant>.SuccessResponse(result, "Tenant created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Tenant>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Tenant>>> GetTenant(Guid id)
    {
        try
        {
            var result = await _tenantService.GetTenantByIdAsync(id);
            if (result == null)
            {
                return NotFound(ApiResponse<Tenant>.ErrorResponse("Tenant not found"));
            }
            return Ok(ApiResponse<Tenant>.SuccessResponse(result, "Tenant retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Tenant>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateTenant(
        Guid id, 
        [FromBody] UpdateTenantRequest request,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _tenantService.UpdateTenantAsync(id, request, userId);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Tenant updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Tenant>>>> GetAllTenants()
    {
        try
        {
            var result = await _tenantService.GetAllTenantsAsync();
            return Ok(ApiResponse<IEnumerable<Tenant>>.SuccessResponse(result, "Tenants retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Tenant>>.ErrorResponse(ex.Message));
        }
    }
}
