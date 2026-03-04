using Dapper;
using Npgsql;
using AuditService.Domain;

namespace AuditService.Repositories;

public interface IAuditRepository
{
    Task<Guid> CreateAsync(AuditLog auditLog);
    Task<(List<AuditLog> Items, int TotalCount)> SearchAsync(
        Guid tenantId, string? entityName, Guid? entityId, string? action,
        Guid? userId, string? serviceName, DateTime? fromDate, DateTime? toDate,
        int pageNumber, int pageSize);
    Task<AuditLog?> GetByIdAsync(Guid id, Guid tenantId);
}

public class AuditRepository : IAuditRepository
{
    private readonly string _connectionString;

    public AuditRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(AuditLog auditLog)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        
        var sql = @"
            INSERT INTO audit_logs (
                tenant_id, user_id, service_name, entity_name, entity_id,
                action, old_data, new_data, ip_address, user_agent, correlation_id
            ) VALUES (
                @TenantId, @UserId, @ServiceName, @EntityName, @EntityId,
                @Action, @OldData::jsonb, @NewData::jsonb, @IpAddress, @UserAgent, @CorrelationId
            ) RETURNING id";

        return await conn.ExecuteScalarAsync<Guid>(sql, auditLog);
    }

    public async Task<(List<AuditLog> Items, int TotalCount)> SearchAsync(
        Guid tenantId, string? entityName, Guid? entityId, string? action,
        Guid? userId, string? serviceName, DateTime? fromDate, DateTime? toDate,
        int pageNumber, int pageSize)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var conditions = new List<string> { "tenant_id = @TenantId" };
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (!string.IsNullOrEmpty(entityName))
        {
            conditions.Add("entity_name = @EntityName");
            parameters.Add("EntityName", entityName);
        }
        if (entityId.HasValue)
        {
            conditions.Add("entity_id = @EntityId");
            parameters.Add("EntityId", entityId);
        }
        if (!string.IsNullOrEmpty(action))
        {
            conditions.Add("action = @Action");
            parameters.Add("Action", action);
        }
        if (userId.HasValue)
        {
            conditions.Add("user_id = @UserId");
            parameters.Add("UserId", userId);
        }
        if (!string.IsNullOrEmpty(serviceName))
        {
            conditions.Add("service_name = @ServiceName");
            parameters.Add("ServiceName", serviceName);
        }
        if (fromDate.HasValue)
        {
            conditions.Add("created_at >= @FromDate");
            parameters.Add("FromDate", fromDate);
        }
        if (toDate.HasValue)
        {
            conditions.Add("created_at <= @ToDate");
            parameters.Add("ToDate", toDate);
        }

        var whereClause = string.Join(" AND ", conditions);
        var countSql = $"SELECT COUNT(*) FROM audit_logs WHERE {whereClause}";
        var totalCount = await conn.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (pageNumber - 1) * pageSize;
        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", offset);

        var dataSql = $@"
            SELECT 
                id as Id, tenant_id as TenantId, user_id as UserId,
                service_name as ServiceName, entity_name as EntityName, entity_id as EntityId,
                action as Action, old_data::text as OldData, new_data::text as NewData,
                ip_address as IpAddress, user_agent as UserAgent, correlation_id as CorrelationId,
                created_at as CreatedAt
            FROM audit_logs 
            WHERE {whereClause}
            ORDER BY created_at DESC
            LIMIT @Limit OFFSET @Offset";

        var items = (await conn.QueryAsync<AuditLog>(dataSql, parameters)).ToList();
        return (items, totalCount);
    }

    public async Task<AuditLog?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT 
                id as Id, tenant_id as TenantId, user_id as UserId,
                service_name as ServiceName, entity_name as EntityName, entity_id as EntityId,
                action as Action, old_data::text as OldData, new_data::text as NewData,
                ip_address as IpAddress, user_agent as UserAgent, correlation_id as CorrelationId,
                created_at as CreatedAt
            FROM audit_logs 
            WHERE id = @Id AND tenant_id = @TenantId";

        return await conn.QueryFirstOrDefaultAsync<AuditLog>(sql, new { Id = id, TenantId = tenantId });
    }
}
