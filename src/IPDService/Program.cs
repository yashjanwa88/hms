using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Extensions;
using Shared.Common.Middleware;
using Shared.EventBus;
using Shared.EventBus.Interfaces;
using IPDService.Repositories;
using IPDService.Application;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IPD Service API", Version = "v1" });
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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddScoped<IAdmissionRepository>(provider => new AdmissionRepository(connectionString));
builder.Services.AddScoped<IWardRepository>(provider => new WardRepository(connectionString));
builder.Services.AddScoped<IBedRepository>(provider => new BedRepository(connectionString));

builder.Services.AddScoped<IIPDService, IPDAppService>();

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
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
