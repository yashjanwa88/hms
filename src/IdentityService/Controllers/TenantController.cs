using IdentityService.Application;
using IdentityService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/identity/v1/tenants")]
public class TenantController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    /// <summary>Onboard a new hospital — creates tenant, roles (from system template), password policy, and admin user.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<TenantRegistrationResult>>> Register([FromBody] RegisterHospitalRequest request)
    {
        try
        {
            var result = await _tenantService.RegisterHospitalAsync(request);
            return Ok(ApiResponse<TenantRegistrationResult>.SuccessResponse(result, "Hospital registered"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<TenantRegistrationResult>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("lookup/{code}")]
    public async Task<ActionResult<ApiResponse<TenantLookupResponse>>> LookupByCode(string code)
    {
        var tenant = await _tenantService.GetByCodeAsync(code);
        if (tenant == null)
            return NotFound(ApiResponse<TenantLookupResponse>.ErrorResponse("Unknown tenant code"));

        var dto = new TenantLookupResponse
        {
            TenantId = tenant.Id,
            Code = tenant.Code,
            Name = tenant.Name
        };
        return Ok(ApiResponse<TenantLookupResponse>.SuccessResponse(dto, "Success"));
    }
}
