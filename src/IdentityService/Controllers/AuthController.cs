using System.Security.Claims;
using IdentityService.Application;
using IdentityService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[Authorize]
[ApiController]
[Route("api/identity/v1/auth")]
public class AuthController : IdentityControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(
        [FromBody] LoginRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            var result = await _authService.LoginAsync(request, tenantId, ipAddress, userAgent);
            var message = result.MfaRequired
                ? "Additional verification required (MFA)."
                : "Login successful";
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [HttpPost("mfa/verify")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyMfa([FromBody] MfaVerifyRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            var result = await _authService.CompleteMfaLoginAsync(
                request.MfaChallengeToken,
                request.Code,
                ipAddress,
                userAgent);
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Login successful"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth-refresh")]
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Token refreshed successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
    }

    [EnableRateLimiting("auth-change-password")]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<object?>>> ChangePassword(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] ChangePasswordRequest request)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = GetUserIdFromClaims();
            await _authService.ChangeOwnPasswordAsync(userId, tenantId, request.CurrentPassword, request.NewPassword);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Password updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object?>>> Logout([FromBody] LogoutRequest request)
    {
        try
        {
            await _authService.LogoutAsync(request.RefreshToken);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Session ended"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("login-history")]
    public async Task<ActionResult<ApiResponse<List<LoginHistoryEntryDto>>>> GetLoginHistory(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromQuery] int take = 50)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _authService.GetLoginHistoryAsync(userId, tenantId, take);
            return Ok(ApiResponse<List<LoginHistoryEntryDto>>.SuccessResponse(result.ToList(), "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<LoginHistoryEntryDto>>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>Non-revoked refresh-token sessions for the current user (no raw token values).</summary>
    [HttpGet("sessions")]
    public async Task<ActionResult<ApiResponse<List<UserSessionDto>>>> GetSessions(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _authService.GetActiveSessionsAsync(userId, tenantId);
            return Ok(ApiResponse<List<UserSessionDto>>.SuccessResponse(result.ToList(), "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<UserSessionDto>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("sessions/revoke")]
    public async Task<ActionResult<ApiResponse<object?>>> RevokeSession(
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] RevokeSessionRequest request)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var ok = await _authService.RevokeSessionAsync(request.SessionId, userId, tenantId);
            if (!ok)
                return NotFound(ApiResponse<object?>.ErrorResponse("Session not found or already ended."));
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Session revoked"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }

    [Authorize(Policy = PermissionPolicies.UserCreate)]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Register(
        [FromBody] RegisterUserRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var actorId = GetUserIdFromClaims();
            var result = await _authService.RegisterUserAsync(request, tenantId, actorId);
            return Ok(ApiResponse<UserResponse>.SuccessResponse(result, "User registered successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<UserResponse>.ErrorResponse(ex.Message));
        }
    }
}

[Authorize(Policy = PermissionPolicies.UserView)]
[ApiController]
[Route("api/identity/v1/users")]
public class UserController : IdentityControllerBase
{
    private readonly IAuthService _authService;

    public UserController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserResponse>>>> GetAllUsers([FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var result = await _authService.GetAllUsersAsync(tenantId);
            return Ok(ApiResponse<List<UserResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<UserResponse>>.ErrorResponse(ex.Message));
        }
    }

    [Authorize(Policy = PermissionPolicies.RoleManage)]
    [HttpGet("{userId:guid}/login-history")]
    public async Task<ActionResult<ApiResponse<List<LoginHistoryEntryDto>>>> GetUserLoginHistory(
        Guid userId,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromQuery] int take = 50)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var result = await _authService.GetLoginHistoryForTenantUserAsync(userId, tenantId, take);
            return Ok(ApiResponse<List<LoginHistoryEntryDto>>.SuccessResponse(result.ToList(), "Success"));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<List<LoginHistoryEntryDto>>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<LoginHistoryEntryDto>>.ErrorResponse(ex.Message));
        }
    }

    [Authorize(Policy = PermissionPolicies.RoleManage)]
    [HttpGet("{userId:guid}/sessions")]
    public async Task<ActionResult<ApiResponse<List<UserSessionDto>>>> GetUserSessions(
        Guid userId,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var result = await _authService.GetActiveSessionsForTenantUserAsync(userId, tenantId);
            return Ok(ApiResponse<List<UserSessionDto>>.SuccessResponse(result.ToList(), "Success"));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<List<UserSessionDto>>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<UserSessionDto>>.ErrorResponse(ex.Message));
        }
    }

    [Authorize(Policy = PermissionPolicies.RoleManage)]
    [HttpPost("{userId:guid}/sessions/revoke")]
    public async Task<ActionResult<ApiResponse<object?>>> RevokeUserSession(
        Guid userId,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] RevokeSessionRequest request)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            var ok = await _authService.RevokeSessionForTenantUserAsync(request.SessionId, userId, tenantId);
            if (!ok)
                return NotFound(ApiResponse<object?>.ErrorResponse("Session not found or already ended."));
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Session revoked"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }

    [Authorize(Policy = PermissionPolicies.UserUpdate)]
    [HttpPost("{userId:guid}/password")]
    public async Task<ActionResult<ApiResponse<object?>>> AdminResetPassword(
        Guid userId,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromBody] AdminResetPasswordRequest request)
    {
        try
        {
            if (!TryValidateTenantHeader(tenantId, out var forbid))
                return forbid;
            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest(ApiResponse<object?>.ErrorResponse("NewPassword is required."));
            await _authService.AdminResetUserPasswordAsync(userId, tenantId, request.NewPassword, request.RequirePasswordChangeOnNextLogin);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Password updated. All active sessions for this user have been signed out."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object?>.ErrorResponse(ex.Message));
        }
    }
}
