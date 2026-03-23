using Dapper;
using IdentityService.Domain;
using Npgsql;

namespace IdentityService.Repositories;

public interface IPermissionRepository
{
    Task<List<Permission>> GetUserPermissionsAsync(Guid userId);
    Task<List<Permission>> GetRolePermissionsAsync(Guid roleId);
    Task<bool> HasPermissionAsync(Guid userId, string permissionCode);
    Task<List<Permission>> GetAllPermissionsAsync();
    Task<Permission?> GetPermissionByIdAsync(Guid permissionId);
    Task<List<Permission>> GetPermissionsByModuleAsync(string module);
    Task<Permission> CreatePermissionAsync(Permission permission);
    Task<Permission> UpdatePermissionAsync(Permission permission);
    Task<bool> DeletePermissionAsync(Guid permissionId);
    Task<bool> AssignPermissionToRoleAsync(Guid roleId, Guid permissionId, Guid? createdBy);
    Task<bool> RemovePermissionFromRoleAsync(Guid roleId, Guid permissionId);
    Task<List<Guid>> GetRolePermissionIdsAsync(Guid roleId);
    Task<bool> BulkAssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds, Guid? createdBy);
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

    public async Task<List<Permission>> GetAllPermissionsAsync()
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT 
                id as Id,
                code as Code,
                name as Name,
                description as Description,
                module as Module,
                created_at as CreatedAt,
                is_deleted as IsDeleted
            FROM permissions
            WHERE is_deleted = false
            ORDER BY module, name";

        var permissions = await conn.QueryAsync<Permission>(sql);
        return permissions.ToList();
    }

    public async Task<Permission?> GetPermissionByIdAsync(Guid permissionId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT 
                id as Id,
                code as Code,
                name as Name,
                description as Description,
                module as Module,
                created_at as CreatedAt,
                is_deleted as IsDeleted
            FROM permissions
            WHERE id = @PermissionId AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<Permission>(sql, new { PermissionId = permissionId });
    }

    public async Task<List<Permission>> GetPermissionsByModuleAsync(string module)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT 
                id as Id,
                code as Code,
                name as Name,
                description as Description,
                module as Module,
                created_at as CreatedAt,
                is_deleted as IsDeleted
            FROM permissions
            WHERE module = @Module AND is_deleted = false
            ORDER BY name";

        var permissions = await conn.QueryAsync<Permission>(sql, new { Module = module });
        return permissions.ToList();
    }

    public async Task<Permission> CreatePermissionAsync(Permission permission)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            INSERT INTO permissions (id, code, name, description, module, created_at, is_deleted)
            VALUES (@Id, @Code, @Name, @Description, @Module, @CreatedAt, @IsDeleted)
            RETURNING id as Id, code as Code, name as Name, description as Description, 
                      module as Module, created_at as CreatedAt, is_deleted as IsDeleted";

        permission.Id = Guid.NewGuid();
        permission.CreatedAt = DateTime.UtcNow;
        permission.IsDeleted = false;

        return await conn.QuerySingleAsync<Permission>(sql, permission);
    }

    public async Task<Permission> UpdatePermissionAsync(Permission permission)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            UPDATE permissions
            SET name = @Name,
                description = @Description,
                module = @Module
            WHERE id = @Id AND is_deleted = false
            RETURNING id as Id, code as Code, name as Name, description as Description, 
                      module as Module, created_at as CreatedAt, is_deleted as IsDeleted";

        return await conn.QuerySingleAsync<Permission>(sql, permission);
    }

    public async Task<bool> DeletePermissionAsync(Guid permissionId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            UPDATE permissions
            SET is_deleted = true
            WHERE id = @PermissionId";

        var rowsAffected = await conn.ExecuteAsync(sql, new { PermissionId = permissionId });
        return rowsAffected > 0;
    }

    public async Task<bool> AssignPermissionToRoleAsync(Guid roleId, Guid permissionId, Guid? createdBy)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            INSERT INTO role_permissions (id, role_id, permission_id, created_at, created_by, is_deleted)
            VALUES (@Id, @RoleId, @PermissionId, @CreatedAt, @CreatedBy, false)
            ON CONFLICT (role_id, permission_id) DO UPDATE
            SET is_deleted = false
            RETURNING id";

        var result = await conn.ExecuteScalarAsync<Guid?>(sql, new 
        { 
            Id = Guid.NewGuid(),
            RoleId = roleId, 
            PermissionId = permissionId, 
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy 
        });

        return result.HasValue;
    }

    public async Task<bool> RemovePermissionFromRoleAsync(Guid roleId, Guid permissionId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            UPDATE role_permissions
            SET is_deleted = true
            WHERE role_id = @RoleId AND permission_id = @PermissionId";

        var rowsAffected = await conn.ExecuteAsync(sql, new { RoleId = roleId, PermissionId = permissionId });
        return rowsAffected > 0;
    }

    public async Task<List<Guid>> GetRolePermissionIdsAsync(Guid roleId)
    {
        using var conn = new NpgsqlConnection(_connectionString);

        var sql = @"
            SELECT permission_id
            FROM role_permissions
            WHERE role_id = @RoleId AND is_deleted = false";

        var permissionIds = await conn.QueryAsync<Guid>(sql, new { RoleId = roleId });
        return permissionIds.ToList();
    }

    public async Task<bool> BulkAssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds, Guid? createdBy)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        using var transaction = conn.BeginTransaction();

        try
        {
            // First, mark all existing permissions as deleted
            var deleteSQL = @"
                UPDATE role_permissions
                SET is_deleted = true
                WHERE role_id = @RoleId";
            
            await conn.ExecuteAsync(deleteSQL, new { RoleId = roleId }, transaction);

            // Then, insert/reactivate the new set of permissions
            if (permissionIds.Any())
            {
                var insertSQL = @"
                    INSERT INTO role_permissions (id, role_id, permission_id, created_at, created_by, is_deleted)
                    VALUES (@Id, @RoleId, @PermissionId, @CreatedAt, @CreatedBy, false)
                    ON CONFLICT (role_id, permission_id) DO UPDATE
                    SET is_deleted = false";

                var parameters = permissionIds.Select(permId => new
                {
                    Id = Guid.NewGuid(),
                    RoleId = roleId,
                    PermissionId = permId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = createdBy
                });

                await conn.ExecuteAsync(insertSQL, parameters, transaction);
            }

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
