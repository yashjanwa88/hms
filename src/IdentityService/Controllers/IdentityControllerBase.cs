using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace IdentityService.Controllers;

/// <summary>Shared JWT tenant checks so <c>X-Tenant-Id</c> cannot diverge from the signed-in org.</summary>
public abstract class IdentityControllerBase : ControllerBase
{
    protected bool TryValidateTenantHeader(Guid tenantId, out ActionResult forbid)
    {
        var claim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var jwtTenant) || jwtTenant != tenantId)
        {
            forbid = Forbid();
            return false;
        }

        forbid = default!;
        return true;
    }

    protected Guid GetUserIdFromClaims() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    protected Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new UnauthorizedAccessException("User ID not found in claims");
        }
        return Guid.Parse(userIdClaim);
    }

    protected ActionResult<ApiResponse<T>> Success<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse<T>.SuccessResponse(data, message));
    }

    protected ApiResponse<T> Error<T>(string message)
    {
        return ApiResponse<T>.ErrorResponse(message);
    }
}
