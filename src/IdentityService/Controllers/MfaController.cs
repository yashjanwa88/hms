using System.Security.Claims;
using IdentityService.Application;
using IdentityService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[Authorize]
[ApiController]
[Route("api/identity/v1/mfa")]
public class MfaController : IdentityControllerBase
{
    private readonly IMfaService _mfaService;
    private readonly IConfiguration _configuration;

    public MfaController(IMfaService mfaService, IConfiguration configuration)
    {
        _mfaService = mfaService;
        _configuration = configuration;
    }

    [HttpPost("enroll")]
    public async Task<ActionResult<ApiResponse<MfaEnrollmentStartResult>>> StartEnrollment(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "DigitalHospital";
            var result = await _mfaService.StartEnrollmentAsync(userId, tenantId, email, issuer);
            return Ok(ApiResponse<MfaEnrollmentStartResult>.SuccessResponse(result,
                "Add this account to your authenticator app, then confirm with a code."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<MfaEnrollmentStartResult>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<ApiResponse<object?>>> ConfirmEnrollment(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] MfaConfirmEnrollmentRequest request)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var ok = await _mfaService.CompleteEnrollmentAsync(userId, tenantId, request.Code.Trim());
            if (!ok)
                return BadRequest(ApiResponse<object?>.ErrorResponse("Invalid code or enrollment not started."));
            return Ok(ApiResponse<object?>.SuccessResponse(null, "MFA enabled"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }
}
