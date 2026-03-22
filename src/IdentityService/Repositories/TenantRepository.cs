using Dapper;
using IdentityService.Domain;
using Npgsql;

namespace IdentityService.Repositories;

public interface ITenantRepository
{
    Task<Guid> CreateAsync(Tenant tenant);
    Task<Tenant?> GetByCodeAsync(string code);
    Task<Tenant?> GetByIdAsync(Guid id);
}

public class TenantRepository : ITenantRepository
{
    private readonly string _connectionString;

    public TenantRepository(string connectionString) => _connectionString = connectionString;

    public async Task<Guid> CreateAsync(Tenant tenant)
    {
        tenant.Id = Guid.NewGuid();
        tenant.CreatedAt = DateTime.UtcNow;
        tenant.IsDeleted = false;

        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            INSERT INTO tenants (id, name, code, primary_email, timezone, is_active, created_at, is_deleted)
            VALUES (@Id, @Name, @Code, @PrimaryEmail, @Timezone, @IsActive, @CreatedAt, false)";
        await connection.ExecuteAsync(sql, tenant);
        return tenant.Id;
    }

    public async Task<Tenant?> GetByCodeAsync(string code)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            SELECT id AS Id, name AS Name, code AS Code, primary_email AS PrimaryEmail, timezone AS Timezone,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt, is_deleted AS IsDeleted
            FROM tenants WHERE UPPER(code) = UPPER(@Code) AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Code = code });
    }

    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            SELECT id AS Id, name AS Name, code AS Code, primary_email AS PrimaryEmail, timezone AS Timezone,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt, is_deleted AS IsDeleted
            FROM tenants WHERE id = @Id AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Id = id });
    }
}
