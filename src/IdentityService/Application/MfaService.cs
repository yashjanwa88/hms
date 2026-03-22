using System.Security.Cryptography;
using IdentityService.Domain;
using IdentityService.Repositories;
using Microsoft.AspNetCore.DataProtection;
using OtpNet;

namespace IdentityService.Application;

public interface IMfaService
{
    /// <summary>Generate secret, persist protected (not enabled until confirmed).</summary>
    Task<MfaEnrollmentStartResult> StartEnrollmentAsync(Guid userId, Guid tenantId, string accountEmail, string issuer);

    Task<bool> CompleteEnrollmentAsync(Guid userId, Guid tenantId, string code);

    Task<bool> IsMfaEnabledAsync(Guid userId, Guid tenantId);

    Task<bool> VerifyCurrentCodeAsync(Guid userId, Guid tenantId, string code);

    Task DisableAsync(Guid userId, Guid tenantId);
}

public sealed class MfaEnrollmentStartResult
{
    public string ManualEntryKeyBase32 { get; init; } = string.Empty;
    public string OtpAuthUri { get; init; } = string.Empty;
}

public class MfaService : IMfaService
{
    private readonly IUserMfaRepository _mfaRepository;
    private readonly IDataProtector _protector;

    public MfaService(IUserMfaRepository mfaRepository, IDataProtectionProvider dataProtectionProvider)
    {
        _mfaRepository = mfaRepository;
        _protector = dataProtectionProvider.CreateProtector("Identity.Mfa.Totp.v1");
    }

    public async Task<MfaEnrollmentStartResult> StartEnrollmentAsync(Guid userId, Guid tenantId, string accountEmail, string issuer)
    {
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var base32 = Base32Encoding.ToString(secretBytes);
        var protectedBlob = _protector.Protect(secretBytes);

        await _mfaRepository.UpsertAsync(new UserMfaSettings
        {
            UserId = userId,
            TenantId = tenantId,
            SecretProtected = Convert.ToBase64String(protectedBlob),
            IsEnabled = false,
            CreatedAt = DateTime.UtcNow
        });

        var uri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(accountEmail)}?secret={base32}&issuer={Uri.EscapeDataString(issuer)}";

        return new MfaEnrollmentStartResult
        {
            ManualEntryKeyBase32 = base32,
            OtpAuthUri = uri
        };
    }

    public async Task<bool> CompleteEnrollmentAsync(Guid userId, Guid tenantId, string code)
    {
        var row = await _mfaRepository.GetAsync(userId, tenantId);
        if (row == null || row.IsEnabled)
            return false;

        if (!TryGetSecretBytes(row.SecretProtected, out var secretBytes))
            return false;

        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(code, out _, new VerificationWindow(1, 1)))
            return false;

        row.IsEnabled = true;
        row.UpdatedAt = DateTime.UtcNow;
        await _mfaRepository.UpsertAsync(row);
        return true;
    }

    public async Task<bool> IsMfaEnabledAsync(Guid userId, Guid tenantId)
    {
        var row = await _mfaRepository.GetAsync(userId, tenantId);
        return row is { IsEnabled: true };
    }

    public async Task<bool> VerifyCurrentCodeAsync(Guid userId, Guid tenantId, string code)
    {
        var row = await _mfaRepository.GetAsync(userId, tenantId);
        if (row is not { IsEnabled: true })
            return false;

        if (!TryGetSecretBytes(row.SecretProtected, out var secretBytes))
            return false;

        var totp = new Totp(secretBytes);
        return totp.VerifyTotp(code, out _, new VerificationWindow(1, 1));
    }

    public async Task DisableAsync(Guid userId, Guid tenantId)
    {
        await _mfaRepository.SetEnabledAsync(userId, tenantId, false);
    }

    private bool TryGetSecretBytes(string secretProtectedBase64, out byte[] secretBytes)
    {
        secretBytes = Array.Empty<byte>();
        try
        {
            var blob = Convert.FromBase64String(secretProtectedBase64);
            secretBytes = _protector.Unprotect(blob);
            return secretBytes.Length > 0;
        }
        catch (CryptographicException)
        {
            return false;
        }
    }
}
