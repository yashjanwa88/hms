using IdentityService.Domain;
using IdentityService.DTOs;
using IdentityService.Repositories;
using Shared.Common.Helpers;

namespace IdentityService.Application;

public interface ISecurityService
{
    Task<PasswordPolicy> GetPasswordPolicyAsync(Guid tenantId);
    Task<bool> ValidatePasswordAsync(string password, Guid tenantId);
    Task<bool> IsAccountLockedAsync(Guid userId, Guid tenantId);
    Task HandleFailedLoginAsync(Guid userId, Guid tenantId);
    Task ResetFailedAttemptsAsync(Guid userId, Guid tenantId);
    Task<bool> ShouldForcePasswordChangeAsync(Guid userId, Guid tenantId);
}

public class SecurityService : ISecurityService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordPolicyRepository _passwordPolicyRepository;

    public SecurityService(IUserRepository userRepository, IPasswordPolicyRepository passwordPolicyRepository)
    {
        _userRepository = userRepository;
        _passwordPolicyRepository = passwordPolicyRepository;
    }

    public async Task<PasswordPolicy> GetPasswordPolicyAsync(Guid tenantId)
    {
        return await _passwordPolicyRepository.GetByTenantAsync(tenantId) 
            ?? new PasswordPolicy { MinLength = 6, MaxFailedAttempts = 5, LockoutDurationMinutes = 30 };
    }

    public async Task<bool> ValidatePasswordAsync(string password, Guid tenantId)
    {
        var policy = await GetPasswordPolicyAsync(tenantId);
        
        if (password.Length < policy.MinLength) return false;
        if (policy.RequireUppercase && !password.Any(char.IsUpper)) return false;
        if (policy.RequireLowercase && !password.Any(char.IsLower)) return false;
        if (policy.RequireNumbers && !password.Any(char.IsDigit)) return false;
        if (policy.RequireSpecialChars && !password.Any(c => !char.IsLetterOrDigit(c))) return false;

        return true;
    }

    public async Task<bool> IsAccountLockedAsync(Guid userId, Guid tenantId)
    {
        var user = await _userRepository.GetByIdAsync(userId, tenantId);
        return user?.LockedUntil.HasValue == true && user.LockedUntil > DateTime.UtcNow;
    }

    public async Task HandleFailedLoginAsync(Guid userId, Guid tenantId)
    {
        var policy = await GetPasswordPolicyAsync(tenantId);
        await _userRepository.IncrementFailedAttemptsAsync(userId, tenantId, policy.MaxFailedAttempts, policy.LockoutDurationMinutes);
    }

    public async Task ResetFailedAttemptsAsync(Guid userId, Guid tenantId)
    {
        await _userRepository.ResetFailedAttemptsAsync(userId, tenantId);
    }

    public async Task<bool> ShouldForcePasswordChangeAsync(Guid userId, Guid tenantId)
    {
        var user = await _userRepository.GetByIdAsync(userId, tenantId);
        if (user?.ForcePasswordChange == true) return true;

        var policy = await GetPasswordPolicyAsync(tenantId);
        if (policy.PasswordExpiryDays > 0 && user?.PasswordChangedAt.HasValue == true)
        {
            return user.PasswordChangedAt.Value.AddDays(policy.PasswordExpiryDays) < DateTime.UtcNow;
        }

        return false;
    }
}