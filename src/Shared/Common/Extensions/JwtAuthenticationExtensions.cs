using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Shared.Common.Extensions;

/// <summary>
/// Central JWT validation aligned with IdentityService token issuance (issuer, audience, signing key).
/// Resolves secret from JwtSettings:SecretKey, then legacy Jwt:Secret or Jwt:Key.
/// </summary>
public static class JwtAuthenticationExtensions
{
    public static IServiceCollection AddDigitalHospitalJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<JwtBearerOptions>? configureJwtBearer = null)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddDigitalHospitalJwtBearer(configuration, configureJwtBearer);
        return services;
    }

    public static AuthenticationBuilder AddDigitalHospitalJwtBearer(
        this AuthenticationBuilder authenticationBuilder,
        IConfiguration configuration,
        Action<JwtBearerOptions>? configureJwtBearer = null)
    {
        return authenticationBuilder.AddJwtBearer(options =>
        {
            var secret = ResolveSecret(configuration);
            var issuer = configuration["JwtSettings:Issuer"] ?? configuration["Jwt:Issuer"];
            var audience = configuration["JwtSettings:Audience"] ?? configuration["Jwt:Audience"];

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = !string.IsNullOrEmpty(issuer),
                ValidIssuer = issuer,
                ValidateAudience = !string.IsNullOrEmpty(audience),
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
            configureJwtBearer?.Invoke(options);
        });
    }

    private static string ResolveSecret(IConfiguration configuration)
    {
        var secret = configuration["JwtSettings:SecretKey"]
            ?? configuration["Jwt:Secret"]
            ?? configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException(
                "JWT signing key is not configured. Set JwtSettings:SecretKey (or legacy Jwt:Secret / Jwt:Key).");
        return secret;
    }
}
