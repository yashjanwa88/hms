using IdentityService.Domain;
using IdentityService.DTOs;
using IdentityService.Repositories;
using Shared.Common.Helpers;

namespace IdentityService.Application;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, Guid tenantId, string ipAddress, string userAgent);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task<UserResponse> RegisterUserAsync(RegisterUserRequest request, Guid tenantId, Guid createdBy);
    Task<List<UserResponse>> GetAllUsersAsync(Guid tenantId);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILoginAuditRepository _loginAuditRepository;
    private readonly string _jwtSecret;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ILoginAuditRepository loginAuditRepository,
        string jwtSecret)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _loginAuditRepository = loginAuditRepository;
        _jwtSecret = jwtSecret;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, Guid tenantId, string ipAddress, string userAgent)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, tenantId);
        
        Console.WriteLine($"Login attempt - Email: {request.Email}, TenantId: {tenantId}, User found: {user != null}");
        
        if (user == null)
        {
            await LogLoginAuditAsync(Guid.Empty, tenantId, ipAddress, userAgent, false, "User not found");
            throw new UnauthorizedAccessException("Invalid email or password");
        }
        
        Console.WriteLine($"User IsActive: {user.IsActive}");
        
        if (!user.IsActive)
        {
            await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, false, "User inactive");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var passwordValid = PasswordHasher.VerifyPassword(request.Password, user.PasswordHash);
        Console.WriteLine($"Password verification - Valid: {passwordValid}, Input: {request.Password}, Hash: {user.PasswordHash}");
        
        if (!passwordValid)
        {
            await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, false, "Invalid password");
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var role = await _roleRepository.GetByIdAsync(user.RoleId, tenantId);
        if (role == null)
        {
            throw new Exception("User role not found");
        }

        var accessToken = JwtHelper.GenerateToken(user.Id, tenantId, user.Email, role.Name, _jwtSecret);
        var refreshToken = JwtHelper.GenerateRefreshToken();

        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            TenantId = tenantId,
            CreatedBy = user.Id
        });

        await _userRepository.UpdateLastLoginAsync(user.Id, tenantId);
        await LogLoginAuditAsync(user.Id, tenantId, ipAddress, userAgent, true, null);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserId = user.Id,
            TenantId = tenantId,
            Email = user.Email,
            Role = role.Name,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(string refreshToken)
    {
        var token = await _refreshTokenRepository.GetByTokenAsync(refreshToken);
        
        if (token == null || token.IsRevoked || token.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var user = await _userRepository.GetByIdAsync(token.UserId, token.TenantId);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("User not found or inactive");
        }

        var role = await _roleRepository.GetByIdAsync(user.RoleId, token.TenantId);
        if (role == null)
        {
            throw new Exception("User role not found");
        }

        var accessToken = JwtHelper.GenerateToken(user.Id, token.TenantId, user.Email, role.Name, _jwtSecret);
        var newRefreshToken = JwtHelper.GenerateRefreshToken();

        await _refreshTokenRepository.RevokeAsync(refreshToken);
        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            TenantId = token.TenantId,
            CreatedBy = user.Id
        });

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            UserId = user.Id,
            TenantId = token.TenantId,
            Email = user.Email,
            Role = role.Name,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }

    public async Task<UserResponse> RegisterUserAsync(RegisterUserRequest request, Guid tenantId, Guid createdBy)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, tenantId);
        if (existingUser != null)
        {
            throw new Exception("User with this email already exists");
        }

        Role? role = null;
        
        if (request.RoleId != Guid.Empty)
        {
            role = await _roleRepository.GetByIdAsync(request.RoleId, tenantId);
        }
        else if (!string.IsNullOrEmpty(request.RoleName))
        {
            role = await _roleRepository.GetByNameAsync(request.RoleName, tenantId);
        }
        
        if (role == null)
        {
            throw new Exception("Invalid role specified");
        }

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
            CreatedBy = createdBy
        };

        Console.WriteLine($"Creating user with IsActive: {user.IsActive}");

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
            CreatedBy = userId
        });
    }
}
