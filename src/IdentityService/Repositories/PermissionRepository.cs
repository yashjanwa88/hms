using Dapper;
using IdentityService.Domain;
using Npgsql;

namespace IdentityService.Repositories;

public interface IPermissionRepository
{
    Task<List<Permission>> GetUserPermissionsAsync(Guid userId);
    Task<List<Permission>> GetRolePermissionsAsync(Guid roleId);
    Task<bool> HasPermissionAsync(Guid userId, string permissionCode);
}

public class PermissionRepository : IPermissionRepository
{
    private readonly string _connectionString;

    public PermissionRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<List<Permission>> GetUserPermissionsAsync(Guid userId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT DISTINCT 
                p.id as Id,
                p.code as Code,
                p.name as Name,
                p.description as Description,
                p.module as Module,
                p.created_at as CreatedAt,
                p.is_deleted as IsDeleted
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            INNER JOIN users u ON rp.role_id = u.role_id
            WHERE u.id = @UserId 
                AND p.is_deleted = false 
                AND rp.is_deleted = false
                AND u.is_deleted = false";

        var permissions = await conn.QueryAsync<Permission>(sql, new { UserId = userId });
        return permissions.ToList();
    }

    public async Task<List<Permission>> GetRolePermissionsAsync(Guid roleId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT 
                p.id as Id,
                p.code as Code,
                p.name as Name,
                p.description as Description,
                p.module as Module,
                p.created_at as CreatedAt,
                p.is_deleted as IsDeleted
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = @RoleId 
                AND p.is_deleted = false 
                AND rp.is_deleted = false";

        var permissions = await conn.QueryAsync<Permission>(sql, new { RoleId = roleId });
        return permissions.ToList();
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode)
    {
        using var conn = new NpgsqlConnection(_connectionString);

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
            )";

        return await conn.ExecuteScalarAsync<bool>(sql, new { UserId = userId, PermissionCode = permissionCode });
    }
}
