using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Shared.Common.Authorization;

namespace Shared.Common.Services;

public class PermissionService : IPermissionService
{
    private readonly string? _identityConnectionString;

    public PermissionService(IConfiguration configuration)
    {
        _identityConnectionString = configuration.GetConnectionString("IdentityConnection");
    }

    public async Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, string permissionCode)
    {
        if (string.IsNullOrWhiteSpace(_identityConnectionString))
            return false;

        await using var conn = new NpgsqlConnection(_identityConnectionString);

        const string sql = @"
            SELECT EXISTS(
                SELECT 1
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id AND rp.is_deleted = false
                INNER JOIN users u ON rp.role_id = u.role_id AND u.is_deleted = false AND u.is_active = true
                WHERE u.id = @UserId
                  AND u.tenant_id = @TenantId
                  AND p.code = @PermissionCode
                  AND p.is_deleted = false
            )";

        return await conn.ExecuteScalarAsync<bool>(sql,
            new { UserId = userId, TenantId = tenantId, PermissionCode = permissionCode });
    }
}
