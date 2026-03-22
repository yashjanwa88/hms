using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Shared.Common.Helpers;

/// <summary>
/// JWT creation and validation helpers for identity and downstream services.
/// </summary>
public class JwtHelper
{
    public const string TokenUseClaim = "token_use";
    public const string TokenUseMfaChallenge = "mfa_challenge";

    public static string GenerateToken(
        Guid userId,
        Guid tenantId,
        string email,
        string role,
        string secretKey,
        int expiryMinutes = 60,
        string? issuer = null,
        string? audience = null,
        IReadOnlyList<string>? permissionCodes = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("TenantId", tenantId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role)
        };

        if (permissionCodes is { Count: > 0 })
        {
            foreach (var code in permissionCodes)
                claims.Add(new Claim("permission", code));
        }

        return CreateJwt(claims, secretKey, expiryMinutes, issuer, audience);
    }

    /// <summary>Short-lived token used between password verification and MFA code entry.</summary>
    public static string GenerateMfaChallengeToken(
        Guid userId,
        Guid tenantId,
        string email,
        string secretKey,
        int expiryMinutes = 5,
        string? issuer = null,
        string? audience = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("TenantId", tenantId.ToString()),
            new(ClaimTypes.Email, email),
            new(TokenUseClaim, TokenUseMfaChallenge)
        };

        return CreateJwt(claims, secretKey, expiryMinutes, issuer, audience);
    }

    public static string GenerateRefreshToken() => Guid.NewGuid().ToString("N");

    public static ClaimsPrincipal? ValidateToken(
        string token,
        string secretKey,
        string? issuer = null,
        string? audience = null)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = issuer != null,
                ValidIssuer = issuer,
                ValidateAudience = audience != null,
                ValidAudience = audience,
                ClockSkew = TimeSpan.FromMinutes(1)
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public static bool IsMfaChallengeToken(ClaimsPrincipal principal) =>
        principal.FindFirst(TokenUseClaim)?.Value == TokenUseMfaChallenge;

    private static string CreateJwt(
        List<Claim> claims,
        string secretKey,
        int expiryMinutes,
        string? issuer,
        string? audience)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        if (!string.IsNullOrEmpty(issuer))
            descriptor.Issuer = issuer;
        if (!string.IsNullOrEmpty(audience))
            descriptor.Audience = audience;

        var token = tokenHandler.CreateToken(descriptor);
        return tokenHandler.WriteToken(token);
    }
}
