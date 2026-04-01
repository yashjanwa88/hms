using Microsoft.OpenApi.Models;
using PatientService.Application;
using PatientService.Repositories;
using PatientService.Middleware;
using Serilog;
using Shared.Common.Extensions;
using Shared.Common.Middleware;
using Shared.EventBus;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text;
using System.Diagnostics;
using Microsoft.Extensions.Caching.Distributed;
using FluentValidation;
using FluentValidation.AspNetCore;
using PatientService.Validators;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<PatientSearchRequestValidator>();
builder.Services.AddEndpointsApiExplorer();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 50 * 1024 * 1024); // 50MB for import
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Patient Service API", Version = "v1" });
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

builder.Services.AddDigitalHospitalJwtAuthentication(builder.Configuration);
builder.Services.AddDigitalHospitalPermissionAuthorization();

// Redis Cache
var redisConnection = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrEmpty(redisConnection))
{
    try
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
        });
        builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnection));
    }
    catch (Exception ex)
    {
        Log.Warning("Redis connection failed: {Message}. Continuing without Redis.", ex.Message);
        builder.Services.AddMemoryCache(); // Fallback to in-memory cache
    }
}
else
{
    builder.Services.AddMemoryCache();
}

// RabbitMQ (Optional)
var rabbitMQHost = builder.Configuration["RabbitMQ:HostName"];
if (!string.IsNullOrEmpty(rabbitMQHost))
{
    try
    {
        builder.Services.AddSingleton<IEventBus>(new RabbitMQEventBus(rabbitMQHost));
    }
    catch (Exception ex)
    {
        Log.Warning("RabbitMQ connection failed: {Message}. Continuing without RabbitMQ.", ex.Message);
        builder.Services.AddSingleton<IEventBus>(new NoOpEventBus());
    }
}
else
{
    builder.Services.AddSingleton<IEventBus>(new NoOpEventBus());
}

// Repositories - Create new connection per request
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddScoped<IPatientRepository>(provider => 
    new PatientRepository(connectionString));
builder.Services.AddScoped<IInsuranceProviderRepository>(sp => new InsuranceProviderRepository(connectionString));
builder.Services.AddScoped<IPatientRegistrationRepository>(sp => new PatientRegistrationRepository(connectionString));
builder.Services.AddScoped<IMastersRepository>(sp => new MastersRepository(connectionString));
builder.Services.AddScoped<IQueueRepository>(sp => new QueueRepository(connectionString));
builder.Services.AddScoped<IRenewalRepository>(sp => new RenewalRepository(connectionString));
builder.Services.AddScoped<ICardReprintRepository>(sp => new CardReprintRepository(connectionString));
builder.Services.AddScoped<IAuditLogRepository>(sp => new AuditLogRepository(connectionString));

// Clinical Data Repositories
builder.Services.AddScoped<IPatientAllergyRepository>(sp => new PatientAllergyRepository(connectionString));
builder.Services.AddScoped<IPatientChronicConditionRepository>(sp => new PatientChronicConditionRepository(connectionString));
builder.Services.AddScoped<IPatientMedicationHistoryRepository>(sp => new PatientMedicationHistoryRepository(connectionString));
builder.Services.AddScoped<IPatientImmunizationRepository>(sp => new PatientImmunizationRepository(connectionString));
builder.Services.AddScoped<IPatientDocumentRepository>(sp => new PatientDocumentRepository(connectionString));

// Services - Use standard service
builder.Services.AddScoped<IPatientService, PatientAppService>();
builder.Services.AddScoped<IPatientRegistrationService, PatientRegistrationService>();
builder.Services.AddScoped<IPatientClinicalService, PatientClinicalService>();
builder.Services.AddScoped<Shared.Common.Services.IAuditClient, Shared.Common.Services.AuditClient>();
builder.Services.AddScoped<Shared.Common.Authorization.IPermissionService, Shared.Common.Services.PermissionService>();
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

builder.Services.AddHealthChecks();

var app = builder.Build();

// Run database migrations
using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<Shared.Common.Services.IDatabaseMigrationService>();
    await migrationService.RunMigrationsAsync();
}

app.UseMiddleware<PerformanceMonitoringMiddleware>();
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
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
