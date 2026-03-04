using Dapper;
using Npgsql;
using Shared.Common.Authorization;
using Microsoft.Extensions.Configuration;

namespace Shared.Common.Services;

public class PermissionService : IPermissionService
{
    private readonly string _identityConnectionString;

    public PermissionService(IConfiguration configuration)
    {
        _identityConnectionString = configuration.GetConnectionString("IdentityConnection") 
            ?? "Host=localhost;Port=5432;Database=identity_db;Username=postgres;Password=yash@9588";
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode)
    {
        using var conn = new NpgsqlConnection(_identityConnectionString);

        var sql = @"
            SELECT EXISTS(
                SELECT 1 
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                INNER JOIN users u ON rp.role_id = u.role_id
                WHERE u.id = @UserId 
                    AND p.code = @PermissionCode
                    AND p.is_deleted = false 
                    AND rp.is_deleted = false
                    AND u.is_deleted = false
                    AND u.is_active = true
            )";

        return await conn.ExecuteScalarAsync<bool>(sql, new { UserId = userId, PermissionCode = permissionCode });
    }
}
