using System.Security.Claims;
using IdentityService.Domain;
using IdentityService.DTOs;
using IdentityService.Repositories;
using Microsoft.Extensions.Logging;
using Shared.Common.Helpers;

namespace IdentityService.Application;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, Guid tenantId, string ipAddress, string userAgent);
    Task<LoginResponse> CompleteMfaLoginAsync(string mfaChallengeToken, string code, string ipAddress, string userAgent);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task<UserResponse> RegisterUserAsync(RegisterUserRequest request, Guid tenantId, Guid createdBy);
    Task<List<UserResponse>> GetAllUsersAsync(Guid tenantId);
    Task LogoutAsync(string refreshToken);
    Task<IReadOnlyList<LoginHistoryEntryDto>> GetLoginHistoryAsync(Guid userId, Guid tenantId, int take = 100);
    Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsAsync(Guid userId, Guid tenantId);
    Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, Guid tenantId);
    Task<IReadOnlyList<LoginHistoryEntryDto>> GetLoginHistoryForTenantUserAsync(Guid targetUserId, Guid tenantId, int take = 100);
    Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsForTenantUserAsync(Guid targetUserId, Guid tenantId);
    Task<bool> RevokeSessionForTenantUserAsync(Guid sessionId, Guid targetUserId, Guid tenantId);
    Task AdminResetUserPasswordAsync(Guid targetUserId, Guid tenantId, string newPassword, bool requirePasswordChangeOnNextLogin);
    Task ChangeOwnPasswordAsync(Guid userId, Guid tenantId, string currentPassword, string newPassword);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILoginAuditRepository _loginAuditRepository;
    private readonly ISecurityService _securityService;
    private readonly IMfaService _mfaService;
    private readonly string _jwtSecret;
    private readonly string? _jwtIssuer;
    private readonly string? _jwtAudience;
    private readonly int _jwtExpiryMinutes;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ILoginAuditRepository loginAuditRepository,
        ISecurityService securityService,
        IMfaService mfaService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _loginAuditRepository = loginAuditRepository;
        _securityService = securityService;
        _mfaService = mfaService;
        _jwtSecret = configuration["JwtSettings:SecretKey"]!;
        _jwtIssuer = configuration["JwtSettings:Issuer"];
        _jwtAudience = configuration["JwtSettings:Audience"];
        _jwtExpiryMinutes = int.TryParse(configuration["JwtSettings:ExpiryMinutes"], out var m) ? m : 60;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, Guid tenantId, string ipAddress, string userAgent)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, tenantId);

        if (user == null)
        {
            await LogLoginAuditAsync(Guid.Empty, tenantId, ipAddress, userAgent, false, "User not found");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (await _securityService.IsAccountLockedAsync(user.Id, tenantId))
        {
            await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, false, "Account locked");
            throw new UnauthorizedAccessException("Account is temporarily locked. Try again later.");
        }

        if (!user.IsActive)
        {
            await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, false, "User inactive");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var passwordOk = PasswordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!passwordOk)
        {
            await _securityService.HandleFailedLoginAsync(user.Id, tenantId);
            await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, false, "Invalid password");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var upgraded = PasswordHasher.UpgradeHashIfLegacy(request.Password, user.PasswordHash);
        if (upgraded != null)
            await _userRepository.UpdatePasswordHashAsync(user.Id, tenantId, upgraded);

        await _securityService.ResetFailedAttemptsAsync(user.Id, tenantId);

        var role = await _roleRepository.GetByIdAsync(user.RoleId, tenantId);
        if (role == null)
            throw new InvalidOperationException("User role not found");

        if (await _mfaService.IsMfaEnabledAsync(user.Id, tenantId))
        {
            var challenge = JwtHelper.GenerateMfaChallengeToken(
                user.Id, tenantId, user.Email, _jwtSecret, 5, _jwtIssuer, _jwtAudience);

            return new LoginResponse
            {
                MfaRequired = true,
                MfaChallengeToken = challenge,
                UserId = user.Id,
                TenantId = tenantId,
                Email = user.Email,
                Role = role.Name,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5)
            };
        }

        return await IssueFullLoginAsync(user, tenantId, role, ipAddress, userAgent);
    }

    public async Task<LoginResponse> CompleteMfaLoginAsync(string mfaChallengeToken, string code, string ipAddress, string userAgent)
    {
        var principal = JwtHelper.ValidateToken(mfaChallengeToken, _jwtSecret, _jwtIssuer, _jwtAudience);
        if (principal == null || !JwtHelper.IsMfaChallengeToken(principal))
            throw new UnauthorizedAccessException("Invalid or expired MFA challenge.");

        var userId = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var tenantId = Guid.Parse(principal.FindFirst("TenantId")!.Value);

        if (!await _mfaService.VerifyCurrentCodeAsync(userId, tenantId, code.Trim()))
        {
            await LogLoginAuditAsync(userId, tenantId, ipAddress, userAgent, false, "Invalid MFA code");
            throw new UnauthorizedAccessException("Invalid authentication code.");
        }

        var user = await _userRepository.GetByIdAsync(userId, tenantId);
        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("User not found or inactive.");

        var role = await _roleRepository.GetByIdAsync(user.RoleId, tenantId);
        if (role == null)
            throw new InvalidOperationException("User role not found");

        return await IssueFullLoginAsync(user, tenantId, role, ipAddress, userAgent);
    }

    public async Task<LoginResponse> RefreshTokenAsync(string refreshToken)
    {
        var token = await _refreshTokenRepository.GetByTokenAsync(refreshToken);

        if (token == null || token.IsRevoked || token.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token");

        await _refreshTokenRepository.TouchLastUsedAsync(refreshToken);

        var user = await _userRepository.GetByIdAsync(token.UserId, token.TenantId);
        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("User not found or inactive");

        var role = await _roleRepository.GetByIdAsync(user.RoleId, token.TenantId);
        if (role == null)
            throw new InvalidOperationException("User role not found");

        var (accessToken, permissions) = await CreateAccessTokenAsync(user, token.TenantId, role);
        var newRefresh = JwtHelper.GenerateRefreshToken();

        await _refreshTokenRepository.RevokeAsync(refreshToken);
        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            TenantId = token.TenantId,
            CreatedBy = user.Id,
            IpAddress = token.IpAddress,
            UserAgent = token.UserAgent
        });

        var forcePw = await _securityService.ShouldForcePasswordChangeAsync(user.Id, token.TenantId);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefresh,
            UserId = user.Id,
            TenantId = token.TenantId,
            Email = user.Email,
            Role = role.Name,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
            Permissions = permissions,
            ForcePasswordChange = forcePw
        };
    }

    public async Task<UserResponse> RegisterUserAsync(RegisterUserRequest request, Guid tenantId, Guid createdBy)
    {
        if (!await _securityService.ValidatePasswordAsync(request.Password, tenantId))
            throw new InvalidOperationException("Password does not meet the tenant password policy.");

        var existingUser = await _userRepository.GetByEmailAsync(request.Email, tenantId);
        if (existingUser != null)
            throw new InvalidOperationException("User with this email already exists");

        Role? role = null;

        if (request.RoleId != Guid.Empty)
            role = await _roleRepository.GetByIdAsync(request.RoleId, tenantId);
        else if (!string.IsNullOrEmpty(request.RoleName))
            role = await _roleRepository.GetByNameAsync(request.RoleName, tenantId);

        if (role == null)
            throw new InvalidOperationException("Invalid role specified");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            RoleId = role.Id,
            IsActive = true,
            TenantId = tenantId,
            CreatedBy = createdBy,
            PasswordChangedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Role = role.Name,
            IsActive = user.IsActive
        };
    }

    public async Task<List<UserResponse>> GetAllUsersAsync(Guid tenantId)
    {
        var users = await _userRepository.GetAllByTenantAsync(tenantId);
        var userResponses = new List<UserResponse>();

        foreach (var user in users)
        {
            var role = await _roleRepository.GetByIdAsync(user.RoleId, tenantId);
            userResponses.Add(new UserResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = role?.Name ?? "Unknown",
                IsActive = user.IsActive
            });
        }

        return userResponses;
    }

    public async Task LogoutAsync(string refreshToken)
    {
        await _refreshTokenRepository.RevokeAsync(refreshToken);
    }

    public async Task<IReadOnlyList<LoginHistoryEntryDto>> GetLoginHistoryAsync(Guid userId, Guid tenantId, int take = 100)
    {
        var rows = await _loginAuditRepository.GetByUserAsync(userId, tenantId, take);
        return rows.Select(a => new LoginHistoryEntryDto
        {
            CreatedAt = a.CreatedAt,
            IsSuccessful = a.IsSuccessful,
            IpAddress = a.IpAddress,
            UserAgent = a.UserAgent,
            FailureReason = a.FailureReason
        }).ToList();
    }

    public async Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsAsync(Guid userId, Guid tenantId)
    {
        var rows = await _refreshTokenRepository.ListActiveForUserAsync(userId, tenantId);
        return rows.Select(t => new UserSessionDto
        {
            Id = t.Id,
            CreatedAt = t.CreatedAt,
            ExpiresAt = t.ExpiresAt,
            LastUsedAt = t.LastUsedAt,
            IpAddress = t.IpAddress,
            UserAgent = t.UserAgent
        }).ToList();
    }

    public Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, Guid tenantId) =>
        _refreshTokenRepository.RevokeByIdForUserAsync(sessionId, userId, tenantId);

    public async Task<IReadOnlyList<LoginHistoryEntryDto>> GetLoginHistoryForTenantUserAsync(Guid targetUserId, Guid tenantId, int take = 100)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, tenantId);
        if (user == null)
            throw new InvalidOperationException("User not found in this tenant.");
        return await GetLoginHistoryAsync(targetUserId, tenantId, take);
    }

    public async Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsForTenantUserAsync(Guid targetUserId, Guid tenantId)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, tenantId);
        if (user == null)
            throw new InvalidOperationException("User not found in this tenant.");
        return await GetActiveSessionsAsync(targetUserId, tenantId);
    }

    public async Task<bool> RevokeSessionForTenantUserAsync(Guid sessionId, Guid targetUserId, Guid tenantId)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, tenantId);
        if (user == null)
            return false;
        return await RevokeSessionAsync(sessionId, targetUserId, tenantId);
    }

    public async Task AdminResetUserPasswordAsync(Guid targetUserId, Guid tenantId, string newPassword, bool requirePasswordChangeOnNextLogin)
    {
        if (!await _securityService.ValidatePasswordAsync(newPassword, tenantId))
            throw new InvalidOperationException("Password does not meet the tenant password policy.");

        var user = await _userRepository.GetByIdAsync(targetUserId, tenantId);
        if (user == null)
            throw new InvalidOperationException("User not found in this tenant.");

        var hash = PasswordHasher.HashPassword(newPassword);
        var ok = await _userRepository.AdminSetPasswordAsync(targetUserId, tenantId, hash, requirePasswordChangeOnNextLogin);
        if (!ok)
            throw new InvalidOperationException("Could not update password.");

        await _refreshTokenRepository.RevokeAllForUserAsync(targetUserId, tenantId);
    }

    public async Task ChangeOwnPasswordAsync(Guid userId, Guid tenantId, string currentPassword, string newPassword)
    {
        var user = await _userRepository.GetByIdAsync(userId, tenantId);
        if (user == null)
            throw new InvalidOperationException("User not found.");

        if (!PasswordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        if (!await _securityService.ValidatePasswordAsync(newPassword, tenantId))
            throw new InvalidOperationException("Password does not meet the tenant password policy.");

        if (PasswordHasher.VerifyPassword(newPassword, user.PasswordHash))
            throw new InvalidOperationException("New password must be different from your current password.");

        await _userRepository.UpdatePasswordHashAsync(userId, tenantId, PasswordHasher.HashPassword(newPassword));
    }

    private async Task<LoginResponse> IssueFullLoginAsync(User user, Guid tenantId, Role role, string ipAddress, string userAgent)
    {
        var (accessToken, permissions) = await CreateAccessTokenAsync(user, tenantId, role);
        var refreshToken = JwtHelper.GenerateRefreshToken();

        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            TenantId = tenantId,
            CreatedBy = user.Id,
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _userRepository.UpdateLastLoginAsync(user.Id, tenantId);
        await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, true, null);

        var forcePw = await _securityService.ShouldForcePasswordChangeAsync(user.Id, tenantId);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserId = user.Id,
            TenantId = tenantId,
            Email = user.Email,
            Role = role.Name,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
            Permissions = permissions,
            ForcePasswordChange = forcePw
        };
    }

    private async Task<(string Token, IReadOnlyList<string> Permissions)> CreateAccessTokenAsync(User user, Guid tenantId, Role role)
    {
        var permissions = await _roleRepository.GetPermissionCodesByRoleIdAsync(role.Id);
        var token = JwtHelper.GenerateToken(
            user.Id,
            tenantId,
            user.Email,
            role.Name,
            _jwtSecret,
            _jwtExpiryMinutes,
            _jwtIssuer,
            _jwtAudience,
            permissions);
        return (token, permissions);
    }

    private async Task LogLoginAuditAsync(Guid userId, Guid tenantId, string ipAddress, string userAgent, bool isSuccessful, string? failureReason)
    {
        await _loginAuditRepository.CreateAsync(new LoginAudit
        {
            UserId = userId,
            TenantId = tenantId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccessful = isSuccessful,
            FailureReason = failureReason,
            CreatedBy = userId == Guid.Empty ? null : userId
        });
    }
}
