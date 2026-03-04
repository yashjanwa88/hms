using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Shared.Common.Services;

public interface IAuditClient
{
    Task LogAsync(string serviceName, string entityName, Guid? entityId, string action, 
        object? oldData = null, object? newData = null, Guid? userId = null, Guid? tenantId = null);
}

public class AuditClient : IAuditClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AuditClient> _logger;
    private readonly string _auditServiceUrl;

    public AuditClient(IConfiguration configuration, ILogger<AuditClient> logger)
    {
        _httpClient = new HttpClient();
        _logger = logger;
        _auditServiceUrl = configuration["AuditService:Url"] ?? "http://localhost:5011";
    }

    public async Task LogAsync(string serviceName, string entityName, Guid? entityId, string action,
        object? oldData = null, object? newData = null, Guid? userId = null, Guid? tenantId = null)
    {
        try
        {
            var request = new
            {
                tenantId = tenantId ?? Guid.Empty,
                userId = userId,
                serviceName,
                entityName,
                entityId,
                action,
                oldData,
                newData
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_auditServiceUrl}/api/audit/log", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Audit log failed: {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send audit log");
        }
    }
}

public class NoOpAuditClient : IAuditClient
{
    public Task LogAsync(string serviceName, string entityName, Guid? entityId, string action,
        object? oldData = null, object? newData = null, Guid? userId = null, Guid? tenantId = null)
    {
        return Task.CompletedTask;
    }
}
