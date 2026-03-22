using Dapper;
using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface ILoginAuditRepository
{
    Task<Guid> CreateAsync(LoginAudit audit);
    Task<IReadOnlyList<LoginAudit>> GetByUserAsync(Guid userId, Guid tenantId, int take = 100);
}

public class LoginAuditRepository : BaseRepository<LoginAudit>, ILoginAuditRepository
{
    protected override string TableName => "login_audits";

    public LoginAuditRepository(string connectionString) : base(connectionString) { }

    public async Task<IReadOnlyList<LoginAudit>> GetByUserAsync(Guid userId, Guid tenantId, int take = 100)
    {
        using var connection = CreateConnection();
        const string sql = @"
            SELECT id AS Id, tenant_id AS TenantId, user_id AS UserId, ip_address AS IpAddress, user_agent AS UserAgent,
                   is_successful AS IsSuccessful, failure_reason AS FailureReason,
                   created_at AS CreatedAt, created_by AS CreatedBy, updated_at AS UpdatedAt, updated_by AS UpdatedBy,
                   is_deleted AS IsDeleted
            FROM login_audits
            WHERE user_id = @UserId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY created_at DESC
            LIMIT @Take";
        var rows = await connection.QueryAsync<LoginAudit>(sql, new { UserId = userId, TenantId = tenantId, Take = take });
        return rows.ToList();
    }
}
