using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditService.Application;
using AuditService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace AuditService.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly IAuditAppService _auditService;

    public AuditController(IAuditAppService auditService)
    {
        _auditService = auditService;
    }

    [HttpPost("log")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateLog([FromBody] CreateAuditLogRequest request)
    {
        if (string.IsNullOrEmpty(request.ServiceName) || string.IsNullOrEmpty(request.EntityName) || string.IsNullOrEmpty(request.Action))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "ServiceName, EntityName, and Action are required",
                Errors = new List<string> { "Missing required fields" }
            });
        }

        // Auto-populate from headers if not provided
        if (request.TenantId == Guid.Empty && Request.Headers.ContainsKey("X-Tenant-Id"))
        {
            request.TenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        }

        if (!request.UserId.HasValue && Request.Headers.ContainsKey("X-User-Id"))
        {
            request.UserId = Guid.Parse(Request.Headers["X-User-Id"].ToString());
        }

        if (string.IsNullOrEmpty(request.CorrelationId) && Request.Headers.ContainsKey("X-Request-Id"))
        {
            request.CorrelationId = Request.Headers["X-Request-Id"].ToString();
        }

        if (string.IsNullOrEmpty(request.IpAddress))
        {
            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        if (string.IsNullOrEmpty(request.UserAgent))
        {
            request.UserAgent = Request.Headers["User-Agent"].ToString();
        }

        var id = await _auditService.LogAsync(request);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Audit log created",
            Data = new { Id = id }
        });
    }

    [HttpGet("search")]
    [RequirePermission("audit.view")]
    public async Task<IActionResult> Search([FromQuery] AuditLogSearchRequest request)
    {
        if (request.TenantId == Guid.Empty && Request.Headers.ContainsKey("X-Tenant-Id"))
        {
            request.TenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        }

        if (request.TenantId == Guid.Empty)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "TenantId is required",
                Errors = new List<string> { "Missing tenant ID" }
            });
        }

        var (items, totalCount) = await _auditService.SearchAsync(request);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = new
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
            }
        });
    }

    [HttpGet("{id}")]
    [RequirePermission("audit.view")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var auditLog = await _auditService.GetByIdAsync(id, tenantId);

        if (auditLog == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Audit log not found"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = auditLog
        });
    }
}
