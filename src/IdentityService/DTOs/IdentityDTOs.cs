namespace IdentityService.DTOs;

public class RegisterHospitalRequest
{
    /// <summary>Unique short code (e.g. CITYHSP01) used at login to resolve tenant.</summary>
    public string HospitalCode { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string AdminFirstName { get; set; } = string.Empty;
    public string AdminLastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class RegisterUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    /// <summary>When true, client must complete <see cref="MfaChallengeToken"/> via MFA verify endpoint.</summary>
    public bool MfaRequired { get; set; }

    /// <summary>Short-lived JWT for the second MFA step (only when <see cref="MfaRequired"/> is true).</summary>
    public string? MfaChallengeToken { get; set; }

    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }

    /// <summary>RBAC permission codes embedded in the access token (for UI gating).</summary>
    public IReadOnlyList<string> Permissions { get; set; } = Array.Empty<string>();

    /// <summary>When true, the client should prompt the user to set a new password before full app access.</summary>
    public bool ForcePasswordChange { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UpdateRolePermissionsRequest
{
    public List<string> PermissionIds { get; set; } = new();
}

public class MfaVerifyRequest
{
    public string MfaChallengeToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class MfaConfirmEnrollmentRequest
{
    public string Code { get; set; } = string.Empty;
}

public class LogoutRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class TenantLookupResponse
{
    public Guid TenantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class LoginHistoryEntryDto
{
    public DateTime CreatedAt { get; set; }
    public bool IsSuccessful { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
}

/// <summary>Active refresh-token row (no raw token — revoke by <see cref="Id"/>).</summary>
public class UserSessionDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public class RevokeSessionRequest
{
    public Guid SessionId { get; set; }
}

public class AdminResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
    public bool RequirePasswordChangeOnNextLogin { get; set; } = true;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
