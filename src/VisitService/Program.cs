using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using VisitService.Application;
using VisitService.Repositories;
using Shared.Common.Middleware;
using Shared.Common.Services;
using Shared.EventBus.Interfaces;
using Shared.EventBus;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/visit-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger Configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Visit Service API", 
        Version = "v1",
        Description = "Digital Hospital - Visit Management Service"
    });
    
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

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5439;Database=visit_db;Username=postgres;Password=postgres";

// Repository Registration
builder.Services.AddScoped<IVisitRepository>(provider => new VisitRepository(connectionString));
builder.Services.AddScoped<IVisitTimelineRepository>(provider => new VisitTimelineRepository(connectionString));

// Application Services
builder.Services.AddScoped<IVisitService, VisitApplicationService>();

// Event Bus
try
{
    var rabbitMQHost = builder.Configuration["RabbitMQ:HostName"];
    if (!string.IsNullOrEmpty(rabbitMQHost))
    {
        builder.Services.AddSingleton<IEventBus>(new RabbitMQEventBus(rabbitMQHost));
    }
    else
    {
        builder.Services.AddSingleton<IEventBus>(new NoOpEventBus());
    }
}
catch (Exception ex)
{
    Log.Warning("RabbitMQ connection failed: {Error}. Continuing without RabbitMQ.", ex.Message);
    builder.Services.AddSingleton<IEventBus>(new NoOpEventBus());
}

// Redis Cache (Optional)
try
{
    var redisConnection = builder.Configuration["Redis:ConnectionString"];
    if (!string.IsNullOrEmpty(redisConnection))
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
        });
    }
}
catch (Exception ex)
{
    Log.Warning("Redis connection failed: {Error}. Continuing without Redis.", ex.Message);
}

// Database Migration Service
builder.Services.AddScoped<Shared.Common.Services.IDatabaseMigrationService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<Shared.Common.Services.DatabaseMigrationService>>();
    return new Shared.Common.Services.DatabaseMigrationService(config, logger, "DefaultConnection");
});

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

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Visit Service API v1");
        c.RoutePrefix = "swagger";
    });
}

// Custom Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Database Migration
try
{
    using var scope = app.Services.CreateScope();
    var migrationService = scope.ServiceProvider.GetRequiredService<Shared.Common.Services.IDatabaseMigrationService>();
    await migrationService.RunMigrationsAsync();
    Log.Information("Database migrations completed successfully");
}
catch (Exception ex)
{
    Log.Error(ex, "Database migration failed");
    throw;
}

Log.Information("Visit Service starting on port 5013...");

app.Urls.Add("http://localhost:5013");
app.Run();