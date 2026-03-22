using System.Security.Claims;
using System.Threading.RateLimiting;
using IdentityService.Application;
using IdentityService.Repositories;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Extensions;
using Shared.Common.Middleware;
using Shared.Common.Models;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Identity Service API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDataProtection();

builder.Services.AddDigitalHospitalJwtAuthentication(builder.Configuration);
builder.Services.AddDigitalHospitalPermissionAuthorization();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddScoped<IUserRepository>(_ => new UserRepository(connectionString));
builder.Services.AddScoped<IRoleRepository>(_ => new RoleRepository(connectionString));
builder.Services.AddScoped<IRefreshTokenRepository>(_ => new RefreshTokenRepository(connectionString));
builder.Services.AddScoped<ILoginAuditRepository>(_ => new LoginAuditRepository(connectionString));
builder.Services.AddScoped<IPasswordPolicyRepository>(_ => new PasswordPolicyRepository(connectionString));
builder.Services.AddScoped<ITenantRepository>(_ => new TenantRepository(connectionString));
builder.Services.AddScoped<IUserMfaRepository>(_ => new UserMfaRepository(connectionString));

builder.Services.AddScoped<ISecurityService, SecurityService>();
builder.Services.AddScoped<IMfaService, MfaService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<Shared.Common.Services.IDatabaseMigrationService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<Shared.Common.Services.DatabaseMigrationService>>();
    return new Shared.Common.Services.DatabaseMigrationService(config, logger, "DefaultConnection");
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var rlAuth = builder.Configuration.GetSection("RateLimiting:Auth");
var windowMinutes = Math.Max(1, rlAuth.GetValue("WindowMinutes", 1));
var loginPerMinute = Math.Max(1, rlAuth.GetValue("LoginPermitLimit", 20));
var refreshPerMinute = Math.Max(1, rlAuth.GetValue("RefreshPermitLimit", 120));
var changePasswordPerMinute = Math.Max(1, rlAuth.GetValue("ChangePasswordPermitLimit", 15));
var rateLimitWindow = TimeSpan.FromMinutes(windowMinutes);
var retryAfterSeconds = (int)Math.Ceiling(rateLimitWindow.TotalSeconds);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth-login", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            $"login:{ip}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = loginPerMinute,
                Window = rateLimitWindow,
                QueueLimit = 0,
            });
    });

    options.AddPolicy("auth-refresh", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            $"refresh:{ip}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = refreshPerMinute,
                Window = rateLimitWindow,
                QueueLimit = 0,
            });
    });

    options.AddPolicy("auth-change-password", httpContext =>
    {
        var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var key = !string.IsNullOrEmpty(userId)
            ? $"change-pw:user:{userId}"
            : $"change-pw:ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
        return RateLimitPartition.GetFixedWindowLimiter(
            key,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = changePasswordPerMinute,
                Window = rateLimitWindow,
                QueueLimit = 0,
            });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.Append("Retry-After", retryAfterSeconds.ToString());
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<object?>.ErrorResponse("Too many requests. Please try again shortly."),
            cancellationToken);
    };
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<Shared.Common.Services.IDatabaseMigrationService>();
    await migrationService.RunMigrationsAsync();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestTrackingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();
