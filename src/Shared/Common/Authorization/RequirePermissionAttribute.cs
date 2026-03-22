using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Shared.Common.Authorization;

/// <summary>
/// Requires an authenticated user, <c>X-Tenant-Id</c> matching JWT <c>TenantId</c>, and either a JWT <c>permission</c> claim
/// or (fallback) a tenant-scoped check via <see cref="IPermissionService"/> against identity_db.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionCode;

    public RequirePermissionAttribute(string permissionCode)
    {
        _permissionCode = permissionCode ?? throw new ArgumentNullException(nameof(permissionCode));
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var http = context.HttpContext;
        var user = http.User;

        if (user.Identity is not { IsAuthenticated: true })
        {
            context.Result = new UnauthorizedObjectResult(new { success = false, message = "Authentication required" });
            return;
        }

        if (!http.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader) ||
            !Guid.TryParse(tenantHeader, out var headerTenantId))
        {
            context.Result = new BadRequestObjectResult(new { success = false, message = "X-Tenant-Id header is required" });
            return;
        }

        var claimTenant = user.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(claimTenant) || !Guid.TryParse(claimTenant, out var jwtTenant) ||
            jwtTenant != headerTenantId)
        {
            context.Result = new ForbidResult();
            return;
        }

        if (user.HasClaim(PermissionAuthorizationHandler.PermissionClaimType, _permissionCode))
            return;

        if (Guid.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
        {
            var permissionService = http.RequestServices.GetService(typeof(IPermissionService)) as IPermissionService;
            if (permissionService != null &&
                await permissionService.HasPermissionAsync(userId, headerTenantId, _permissionCode))
                return;
        }

        context.Result = new ForbidResult();
    }
}

public interface IPermissionService
{
    /// <summary>Resolves permission via identity_db, scoped to <paramref name="tenantId"/>.</summary>
    Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, string permissionCode);
}
