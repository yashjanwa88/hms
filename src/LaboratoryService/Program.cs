using LaboratoryService.Application;
using LaboratoryService.Repositories;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Authorization;
using Shared.Common.Extensions;
using Shared.Common.Services;
using Shared.EventBus;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "LaboratoryService")
    .WriteTo.Console()
    .WriteTo.File("logs/laboratory-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDigitalHospitalJwtAuthentication(builder.Configuration, o =>
{
    o.RequireHttpsMetadata = false;
    o.SaveToken = true;
});
builder.Services.AddDigitalHospitalPermissionAuthorization();
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Redis Configuration (Optional)
var redisConnectionString = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrEmpty(redisConnectionString))
{
    try { builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnectionString)); }
    catch { Log.Warning("Redis unavailable. Continuing without Redis."); }
}

// RabbitMQ Event Bus (Optional)
var rabbitMQHost = builder.Configuration["RabbitMQ:Host"];
if (!string.IsNullOrEmpty(rabbitMQHost))
{
    try { builder.Services.AddSingleton<IEventBus>(new RabbitMQEventBus(rabbitMQHost)); }
    catch { Log.Warning("RabbitMQ unavailable. Continuing without RabbitMQ."); }
}

// Repository Registration
builder.Services.AddScoped<ILabTestRepository, LabTestRepository>();
builder.Services.AddScoped<ILabTestParameterRepository, LabTestParameterRepository>();
builder.Services.AddScoped<ILabOrderRepository, LabOrderRepository>();
builder.Services.AddScoped<ILabOrderItemRepository, LabOrderItemRepository>();
builder.Services.AddScoped<ILabResultRepository, LabResultRepository>();

// Application Service Registration
builder.Services.AddScoped<ILaboratoryAppService, LaboratoryAppService>();
builder.Services.AddScoped<Shared.Common.Services.IDatabaseMigrationService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<Shared.Common.Services.DatabaseMigrationService>>();
    return new Shared.Common.Services.DatabaseMigrationService(config, logger, "DefaultConnection");
});

// Controllers
builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Laboratory Service API",
        Version = "v1",
        Description = "Digital Hospital Laboratory Management Service"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Health Checks
builder.Services.AddHealthChecks();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<Shared.Common.Services.IDatabaseMigrationService>();
    await migrationService.RunMigrationsAsync();
}

// Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Laboratory Service API v1");
    });
}

app.UseSerilogRequestLogging();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

try
{
    Log.Information("Starting Laboratory Service on port 5007");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Laboratory Service failed to start");
}
finally
{
    Log.CloseAndFlush();
}
