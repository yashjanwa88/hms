using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppointmentService.Application;
using AppointmentService.DTOs;
using Shared.Common.Models;

namespace AppointmentService.Controllers;

/// <summary>
/// Queue Management Controller
/// Manages patient queue tokens for OPD operations
/// </summary>
[ApiController]
[Route("api/appointment/v1/queue")]
[Authorize]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;
    private readonly ILogger<QueueController> _logger;

    public QueueController(
        IQueueService queueService,
        ILogger<QueueController> logger)
    {
        _queueService = queueService;
        _logger = logger;
    }

    private Guid GetTenantId() => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid? GetUserId() => Guid.TryParse(Request.Headers["X-User-Id"].ToString(), out var id) ? id : null;

    /// <summary>
    /// Assign queue token to patient
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AssignToken([FromBody] CreateQueueTokenRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            
            var token = await _queueService.AssignTokenAsync(tenantId, request, userId);
            
            return Ok(ApiResponse<QueueTokenResponse>.SuccessResponse(
                token, 
                $"Token {token.TokenNumber} assigned successfully"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning queue token");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to assign token"));
        }
    }

    /// <summary>
    /// Get active queue (waiting, called, in-progress tokens)
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveQueue([FromQuery] Guid? doctorId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var queue = await _queueService.GetActiveQueueAsync(tenantId, doctorId);
            
            return Ok(ApiResponse<List<QueueTokenResponse>>.SuccessResponse(queue));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active queue");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve queue"));
        }
    }

    /// <summary>
    /// Get queue display data (for TV/monitor display)
    /// </summary>
    [HttpGet("display")]
    [AllowAnonymous]  // Allow display screens without auth
    public async Task<IActionResult> GetQueueDisplay([FromQuery] Guid? doctorId = null, [FromQuery] Guid? tenantId = null)
    {
        try
        {
            var tenant = tenantId ?? GetTenantId();
            var display = await _queueService.GetQueueDisplayAsync(tenant, doctorId);
            
            return Ok(ApiResponse<QueueDisplayResponse>.SuccessResponse(display));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving queue display");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve display data"));
        }
    }

    /// <summary>
    /// Call next waiting patient
    /// </summary>
    [HttpPost("call-next")]
    public async Task<IActionResult> CallNextPatient([FromQuery] Guid doctorId)
    {
        try
        {
            var tenantId = GetTenantId();
            var result = await _queueService.CallNextPatientAsync(tenantId, doctorId);
            
            if (result == null)
            {
                return Ok(ApiResponse<object>.SuccessResponse(null, "No patients waiting in queue"));
            }
            
            return Ok(ApiResponse<CallNextPatientResponse>.SuccessResponse(
                result,
                result.Message
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling next patient");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to call next patient"));
        }
    }

    /// <summary>
    /// Call specific token by ID
    /// </summary>
    [HttpPost("{tokenId}/call")]
    public async Task<IActionResult> CallSpecificToken(Guid tokenId)
    {
        try
        {
            var tenantId = GetTenantId();
            var token = await _queueService.CallSpecificTokenAsync(tokenId, tenantId);
            
            if (token == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Token not found or not in waiting status"));
            }
            
            return Ok(ApiResponse<QueueTokenResponse>.SuccessResponse(
                token,
                $"Token {token.TokenNumber} called successfully"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling specific token {TokenId}", tokenId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to call token"));
        }
    }

    /// <summary>
    /// Update token status
    /// </summary>
    [HttpPut("{tokenId}/status")]
    public async Task<IActionResult> UpdateTokenStatus(Guid tokenId, [FromBody] UpdateQueueStatusRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var success = await _queueService.UpdateTokenStatusAsync(tokenId, request.Status, tenantId);
            
            if (!success)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Token not found"));
            }
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Token status updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating token status {TokenId}", tokenId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update token status"));
        }
    }

    /// <summary>
    /// Mark token as completed
    /// </summary>
    [HttpPost("{tokenId}/complete")]
    public async Task<IActionResult> CompleteToken(Guid tokenId)
    {
        try
        {
            var tenantId = GetTenantId();
            var success = await _queueService.CompleteTokenAsync(tokenId, tenantId);
            
            if (!success)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Token not found"));
            }
            
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Token marked as completed"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing token {TokenId}", tokenId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to complete token"));
        }
    }

    /// <summary>
    /// Get all tokens for today
    /// </summary>
    [HttpGet("today")]
    public async Task<IActionResult> GetTodayTokens([FromQuery] Guid? doctorId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var tokens = await _queueService.GetTodayTokensAsync(tenantId, doctorId);
            
            return Ok(ApiResponse<List<QueueTokenResponse>>.SuccessResponse(tokens));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving today's tokens");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve tokens"));
        }
    }

    /// <summary>
    /// Get queue statistics for a specific date
    /// </summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] DateTime? date = null, [FromQuery] Guid? doctorId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var statsDate = date ?? DateTime.UtcNow.Date;
            
            var stats = await _queueService.GetDailyStatisticsAsync(tenantId, statsDate, doctorId);
            
            if (stats == null)
            {
                return Ok(ApiResponse<object>.SuccessResponse(null, "No data available for this date"));
            }
            
            return Ok(ApiResponse<QueueStatisticsResponse>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving queue statistics");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to retrieve statistics"));
        }
    }
}
