using Microsoft.AspNetCore.Authorization;

namespace Shared.Common.Authorization;

/// <summary>Validates <see cref="PermissionRequirement"/> against JWT <c>permission</c> claims issued by IdentityService.</summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    public const string PermissionClaimType = "permission";

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.HasClaim(PermissionClaimType, requirement.PermissionCode))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
