using AnalyticsService.Application;
using AnalyticsService.EventConsumers;
using AnalyticsService.Repositories;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Authorization;
using Shared.Common.Extensions;
using Shared.Common.Middleware;
using Shared.Common.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/analytics-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDigitalHospitalJwtAuthentication(builder.Configuration);
builder.Services.AddDigitalHospitalPermissionAuthorization();
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Redis
var redisConnection = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrEmpty(redisConnection))
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnection));
}

// Repositories
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new Exception("Connection string not configured");
builder.Services.AddScoped<IRevenueSummaryRepository>(sp => new RevenueSummaryRepository(connectionString));
builder.Services.AddScoped<IDoctorPerformanceRepository>(sp => new DoctorPerformanceRepository(connectionString));
builder.Services.AddScoped<IInsuranceSummaryRepository>(sp => new InsuranceSummaryRepository(connectionString));
builder.Services.AddScoped<IPatientSummaryRepository>(sp => new PatientSummaryRepository(connectionString));
builder.Services.AddScoped<IEventOffsetRepository>(sp => new EventOffsetRepository(connectionString));

// Application Services
builder.Services.AddScoped<IAnalyticsService, AnalyticsAppService>();

// Event Consumer
builder.Services.AddHostedService<AnalyticsEventConsumer>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Analytics Service API", Version = "v1" });
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

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

try
{
    Log.Information("Starting Analytics Service");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Analytics Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
