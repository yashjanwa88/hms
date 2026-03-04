using InsuranceService.Application;
using InsuranceService.Integrations;
using InsuranceService.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Common.Middleware;
using Shared.EventBus.Implementations;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/insurance-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new Exception("JWT Secret not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Redis
var redisConnection = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrEmpty(redisConnection))
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnection));
}

// RabbitMQ
var rabbitMQHost = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
var rabbitMQPort = int.Parse(builder.Configuration["RabbitMQ:Port"] ?? "5672");
var rabbitMQUser = builder.Configuration["RabbitMQ:Username"] ?? "guest";
var rabbitMQPass = builder.Configuration["RabbitMQ:Password"] ?? "guest";
builder.Services.AddSingleton<IEventBus>(sp =>
    new RabbitMQEventBus(rabbitMQHost, rabbitMQPort, rabbitMQUser, rabbitMQPass, sp.GetRequiredService<ILogger<RabbitMQEventBus>>()));

// HTTP Client for Patient Service
builder.Services.AddHttpClient<IPatientServiceClient, PatientServiceClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:PatientService"] ?? "http://localhost:5003");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Repositories
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new Exception("Connection string not configured");
builder.Services.AddScoped<IInsuranceProviderRepository>(sp => new InsuranceProviderRepository(connectionString));
builder.Services.AddScoped<IInsurancePolicyRepository>(sp => new InsurancePolicyRepository(connectionString));
builder.Services.AddScoped<IPreAuthorizationRepository>(sp => new PreAuthorizationRepository(connectionString));
builder.Services.AddScoped<IInsuranceClaimRepository>(sp => new InsuranceClaimRepository(connectionString));
builder.Services.AddScoped<IClaimSettlementRepository>(sp => new ClaimSettlementRepository(connectionString));

// Application Services
builder.Services.AddScoped<IInsuranceService, InsuranceAppService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Insurance Service API", Version = "v1" });
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
    Log.Information("Starting Insurance Service");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Insurance Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

