using Dapper;
using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string name, Guid tenantId);
    Task<Role?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(Role role);
    Task<IEnumerable<Role>> GetAllAsync(Guid tenantId);
    Task<IEnumerable<Permission>> GetAllPermissionsAsync();
    Task<IEnumerable<string>> GetRolePermissionsAsync(Guid roleId);
    Task<IReadOnlyList<string>> GetPermissionCodesByRoleIdAsync(Guid roleId);
    Task UpdateRolePermissionsAsync(Guid roleId, List<string> permissionIds);
}

public class RoleRepository : BaseRepository<Role>, IRoleRepository
{
    protected override string TableName => "roles";

    public RoleRepository(string connectionString) : base(connectionString) { }

    public async Task<Role?> GetByNameAsync(string name, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM roles WHERE name = @Name AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Role>(sql, new { Name = name, TenantId = tenantId });
    }

    public async Task<IEnumerable<Permission>> GetAllPermissionsAsync()
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM permissions WHERE is_deleted = false ORDER BY module, name";
        return await connection.QueryAsync<Permission>(sql);
    }

    public async Task<IEnumerable<string>> GetRolePermissionsAsync(Guid roleId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT permission_id::text FROM role_permissions WHERE role_id = @RoleId AND is_deleted = false";
        return await connection.QueryAsync<string>(sql, new { RoleId = roleId });
    }

    public async Task<IReadOnlyList<string>> GetPermissionCodesByRoleIdAsync(Guid roleId)
    {
        using var connection = CreateConnection();
        const string sql = @"
            SELECT p.code
            FROM permissions p
            INNER JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_deleted = false
            WHERE rp.role_id = @RoleId AND p.is_deleted = false
            ORDER BY p.code";
        var rows = await connection.QueryAsync<string>(sql, new { RoleId = roleId });
        return rows.ToList();
    }

    public async Task UpdateRolePermissionsAsync(Guid roleId, List<string> permissionIds)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            await connection.ExecuteAsync(
                "DELETE FROM role_permissions WHERE role_id = @RoleId",
                new { RoleId = roleId }, transaction);

            if (permissionIds.Any())
            {
                var insertSql = "INSERT INTO role_permissions (id, role_id, permission_id) VALUES (@Id, @RoleId, @PermissionId)";
                var insertData = permissionIds.Select(pid => new
                {
                    Id = Guid.NewGuid(),
                    RoleId = roleId,
                    PermissionId = Guid.Parse(pid)
                });
                
                await connection.ExecuteAsync(insertSql, insertData, transaction);
            }
            
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
