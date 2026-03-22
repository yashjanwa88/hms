using EMRService.Application;
using EMRService.Repositories;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Authorization;
using Shared.Common.Extensions;
using Shared.Common.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.WithProperty("Service", "EMRService")
    .WriteTo.Console()
    .WriteTo.File("logs/emr-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EMR Service API", Version = "v1" });
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
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Redis (Optional)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnection))
{
    try
    {
        var configuration = ConfigurationOptions.Parse(redisConnection);
        builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(configuration));
        builder.Services.AddSingleton<ICacheService, RedisCacheService>();
    }
    catch { Log.Warning("Redis unavailable. Continuing without Redis."); }
}

// RabbitMQ (Optional)
try
{
    builder.Services.AddSingleton<IEventPublisher, RabbitMQEventPublisher>();
}
catch { Log.Warning("RabbitMQ unavailable. Continuing without RabbitMQ."); }

// Dependency Injection
builder.Services.AddScoped<IEncounterRepository, EncounterRepository>();
builder.Services.AddScoped<IClinicalNoteRepository, ClinicalNoteRepository>();
builder.Services.AddScoped<IDiagnosisRepository, DiagnosisRepository>();
builder.Services.AddScoped<IVitalRepository, VitalRepository>();
builder.Services.AddScoped<IAllergyRepository, AllergyRepository>();
builder.Services.AddScoped<IProcedureRepository, ProcedureRepository>();
builder.Services.AddScoped<IEMRService, EMRService.Application.EMRService>();
builder.Services.AddScoped<EMRService.Application.IDatabaseMigrationService, EMRService.Application.DatabaseMigrationService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Request Logging Middleware
app.Use(async (context, next) =>
{
    var requestId = Guid.NewGuid().ToString();
    context.Response.Headers.Add("X-Request-Id", requestId);
    
    Log.Information("Request {Method} {Path} - RequestId: {RequestId}", 
        context.Request.Method, context.Request.Path, requestId);
    
    await next();
    
    Log.Information("Response {StatusCode} - RequestId: {RequestId}", 
        context.Response.StatusCode, requestId);
});

// Global Exception Handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (error != null)
        {
            Log.Error(error.Error, "Unhandled exception");
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "An error occurred processing your request",
                errors = new[] { error.Error.Message }
            });
        }
    });
});

app.MapControllers();

// Run database migrations on startup
using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<EMRService.Application.IDatabaseMigrationService>();
    await migrationService.RunMigrationsAsync();
}

Log.Information("EMR Service starting on port {Port}", builder.Configuration["Port"] ?? "5008");
app.Run();
