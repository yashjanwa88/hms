using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Shared.Common.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionCode;

    public RequirePermissionAttribute(string permissionCode)
    {
        _permissionCode = permissionCode;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var httpContext = context.HttpContext;
        
        // Get userId from header
        if (!httpContext.Request.Headers.TryGetValue("X-User-Id", out var userIdHeader) ||
            !Guid.TryParse(userIdHeader, out var userId))
        {
            context.Result = new UnauthorizedObjectResult(new { Success = false, Message = "User ID not found" });
            return;
        }

        // Get permission service
        var permissionService = httpContext.RequestServices.GetService(typeof(IPermissionService)) as IPermissionService;
        if (permissionService == null)
        {
            context.Result = new StatusCodeResult(500);
            return;
        }

        // Check permission
        var hasPermission = await permissionService.HasPermissionAsync(userId, _permissionCode);
        if (!hasPermission)
        {
            context.Result = new ForbidResult();
        }
    }
}

public interface IPermissionService
{
    Task<bool> HasPermissionAsync(Guid userId, string permissionCode);
}
