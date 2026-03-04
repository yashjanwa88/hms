namespace AuditService.DTOs;

public class CreateAuditLogRequest
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    
    public string ServiceName { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    
    public string Action { get; set; } = string.Empty;
    
    public object? OldData { get; set; }
    public object? NewData { get; set; }
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
}

public class AuditLogSearchRequest
{
    public Guid TenantId { get; set; }
    public string? EntityName { get; set; }
    public Guid? EntityId { get; set; }
    public string? Action { get; set; }
    public Guid? UserId { get; set; }
    public string? ServiceName { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class AuditLogResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    
    public string ServiceName { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    
    public string Action { get; set; } = string.Empty;
    
    public object? OldData { get; set; }
    public object? NewData { get; set; }
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
