using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

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
}
