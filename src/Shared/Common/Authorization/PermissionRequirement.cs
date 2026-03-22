using Microsoft.AspNetCore.Authorization;

namespace Shared.Common.Authorization;

/// <summary>Requires a JWT claim <c>permission</c> with the given <see cref="PermissionCode"/>.</summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string PermissionCode { get; }

    public PermissionRequirement(string permissionCode)
    {
        PermissionCode = permissionCode ?? throw new ArgumentNullException(nameof(permissionCode));
    }
}
