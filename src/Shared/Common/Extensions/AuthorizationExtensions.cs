using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Shared.Common.Authorization;

namespace Shared.Common.Extensions;

public static class AuthorizationExtensions
{
    /// <summary>
    /// Registers <see cref="PermissionAuthorizationHandler"/> and permission policies for APIs that use JWT <c>permission</c> claims.
    /// Call after <see cref="JwtAuthenticationExtensions.AddDigitalHospitalJwtAuthentication"/>.
    /// </summary>
    public static IServiceCollection AddDigitalHospitalPermissionAuthorization(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddAuthorization(options =>
        {
            foreach (var (policyName, code) in PermissionPolicies.Registered)
            {
                options.AddPolicy(policyName, policy =>
                    policy.Requirements.Add(new PermissionRequirement(code)));
            }
        });

        return services;
    }
}
