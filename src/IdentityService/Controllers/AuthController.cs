using IdentityService.Application;
using IdentityService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/identity/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request, [FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            var result = await _authService.LoginAsync(request, tenantId, ipAddress, userAgent);
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Login successful"));
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"Login failed - Unauthorized: {ex.Message}");
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Login failed - Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse(ex.Message));
        }
    }

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

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Register(
        [FromBody] RegisterUserRequest request, 
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _authService.RegisterUserAsync(request, tenantId, userId);
            return Ok(ApiResponse<UserResponse>.SuccessResponse(result, "User registered successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<UserResponse>.ErrorResponse(ex.Message));
        }
    }
}

[ApiController]
[Route("api/identity/v1/users")]
public class UserController : ControllerBase
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
            var result = await _authService.GetAllUsersAsync(tenantId);
            return Ok(ApiResponse<List<UserResponse>>.SuccessResponse(result, "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<UserResponse>>.ErrorResponse(ex.Message));
        }
    }
}
