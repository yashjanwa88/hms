using AuditService.Domain;
using AuditService.DTOs;
using AuditService.Repositories;
using System.Text.Json;

namespace AuditService.Application;

public interface IAuditAppService
{
    Task<Guid> LogAsync(CreateAuditLogRequest request);
    Task<(List<AuditLogResponse> Items, int TotalCount)> SearchAsync(AuditLogSearchRequest request);
    Task<AuditLogResponse?> GetByIdAsync(Guid id, Guid tenantId);
}

public class AuditAppService : IAuditAppService
{
    private readonly IAuditRepository _repository;
    private readonly ILogger<AuditAppService> _logger;

    public AuditAppService(IAuditRepository repository, ILogger<AuditAppService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Guid> LogAsync(CreateAuditLogRequest request)
    {
        var auditLog = new AuditLog
        {
            TenantId = request.TenantId,
            UserId = request.UserId,
            ServiceName = request.ServiceName,
            EntityName = request.EntityName,
            EntityId = request.EntityId,
            Action = request.Action,
            OldData = request.OldData != null ? JsonSerializer.Serialize(request.OldData) : null,
            NewData = request.NewData != null ? JsonSerializer.Serialize(request.NewData) : null,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            CorrelationId = request.CorrelationId
        };

        var id = await _repository.CreateAsync(auditLog);
        
        _logger.LogInformation(
            "Audit log created: {Action} on {EntityName} by {UserId} in {ServiceName}",
            request.Action, request.EntityName, request.UserId, request.ServiceName);

        return id;
    }

    public async Task<(List<AuditLogResponse> Items, int TotalCount)> SearchAsync(AuditLogSearchRequest request)
    {
        var (items, totalCount) = await _repository.SearchAsync(
            request.TenantId, request.EntityName, request.EntityId, request.Action,
            request.UserId, request.ServiceName, request.FromDate, request.ToDate,
            request.PageNumber, request.PageSize);

        var responses = items.Select(MapToResponse).ToList();
        return (responses, totalCount);
    }

    public async Task<AuditLogResponse?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var auditLog = await _repository.GetByIdAsync(id, tenantId);
        return auditLog != null ? MapToResponse(auditLog) : null;
    }

    private AuditLogResponse MapToResponse(AuditLog log)
    {
        return new AuditLogResponse
        {
            Id = log.Id,
            TenantId = log.TenantId,
            UserId = log.UserId,
            ServiceName = log.ServiceName,
            EntityName = log.EntityName,
            EntityId = log.EntityId,
            Action = log.Action,
            OldData = !string.IsNullOrEmpty(log.OldData) ? JsonSerializer.Deserialize<object>(log.OldData) : null,
            NewData = !string.IsNullOrEmpty(log.NewData) ? JsonSerializer.Deserialize<object>(log.NewData) : null,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
            CorrelationId = log.CorrelationId,
            CreatedAt = log.CreatedAt
        };
    }
}
