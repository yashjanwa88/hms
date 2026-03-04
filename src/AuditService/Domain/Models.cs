namespace AuditService.Domain;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    
    public string ServiceName { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    
    public string Action { get; set; } = string.Empty;
    
    public string? OldData { get; set; }
    public string? NewData { get; set; }
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    
    public DateTime CreatedAt { get; set; }
}

public static class AuditAction
{
    public const string CREATE = "CREATE";
    public const string UPDATE = "UPDATE";
    public const string DELETE = "DELETE";
    public const string MERGE = "MERGE";
    public const string PAYMENT = "PAYMENT";
    public const string LOGIN = "LOGIN";
    public const string FAILED_LOGIN = "FAILED_LOGIN";
    public const string REFUND = "REFUND";
}
