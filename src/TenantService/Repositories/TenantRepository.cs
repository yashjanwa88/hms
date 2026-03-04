using Dapper;
using TenantService.Domain;
using Shared.Common.Helpers;

namespace TenantService.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant?> GetByEmailAsync(string email);
    Task<Guid> CreateAsync(Tenant tenant);
    Task<bool> UpdateAsync(Tenant tenant);
    Task<IEnumerable<Tenant>> GetAllAsync();
}

public class TenantRepository : ITenantRepository
{
    private readonly string _connectionString;

    public TenantRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        using var connection = new Npgsql.NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM tenants WHERE id = @Id AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Id = id });
    }

    public async Task<Tenant?> GetByEmailAsync(string email)
    {
        using var connection = new Npgsql.NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM tenants WHERE email = @Email AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Email = email });
    }

    public async Task<Guid> CreateAsync(Tenant tenant)
    {
        tenant.Id = Guid.NewGuid();
        tenant.TenantId = tenant.Id;
        tenant.CreatedAt = DateTime.UtcNow;
        tenant.IsDeleted = false;

        using var connection = new Npgsql.NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO tenants (id, tenant_id, hospital_name, email, phone_number, address, city, state, country, postal_code, 
                    is_active, subscription_start_date, subscription_end_date, subscription_plan, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @HospitalName, @Email, @PhoneNumber, @Address, @City, @State, @Country, @PostalCode,
                    @IsActive, @SubscriptionStartDate, @SubscriptionEndDate, @SubscriptionPlan, @CreatedAt, @CreatedBy, @IsDeleted)";
        await connection.ExecuteAsync(sql, tenant);
        return tenant.Id;
    }

    public async Task<bool> UpdateAsync(Tenant tenant)
    {
        tenant.UpdatedAt = DateTime.UtcNow;

        using var connection = new Npgsql.NpgsqlConnection(_connectionString);
        var sql = @"UPDATE tenants SET hospital_name = @HospitalName, phone_number = @PhoneNumber, address = @Address,
                    city = @City, state = @State, country = @Country, postal_code = @PostalCode, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id";
        var result = await connection.ExecuteAsync(sql, tenant);
        return result > 0;
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        using var connection = new Npgsql.NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM tenants WHERE is_deleted = false ORDER BY created_at DESC";
        return await connection.QueryAsync<Tenant>(sql);
    }
}
