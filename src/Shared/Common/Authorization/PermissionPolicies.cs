namespace Shared.Common.Authorization;

/// <summary>ASP.NET policy names aligned with <c>permissions.code</c> in identity_db (prefix <c>Permission:</c>).</summary>
public static class PermissionPolicies
{
    public const string UserView = "Permission:user.view";
    public const string UserCreate = "Permission:user.create";
    public const string UserUpdate = "Permission:user.update";
    public const string RoleManage = "Permission:role.manage";

    /// <summary>Policies registered by <see cref="Extensions.AuthorizationExtensions.AddDigitalHospitalPermissionAuthorization"/>.</summary>
    internal static readonly (string PolicyName, string Code)[] Registered =
    {
        (UserView, "user.view"),
        (UserCreate, "user.create"),
        (UserUpdate, "user.update"),
        (RoleManage, "role.manage"),
    };
}
