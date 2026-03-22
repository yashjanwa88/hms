using Dapper;
using IdentityService.Domain;
using Npgsql;

namespace IdentityService.Repositories;

public interface IUserMfaRepository
{
    Task<UserMfaSettings?> GetAsync(Guid userId, Guid tenantId);
    Task UpsertAsync(UserMfaSettings settings);
    Task SetEnabledAsync(Guid userId, Guid tenantId, bool enabled);
}

public class UserMfaRepository : IUserMfaRepository
{
    private readonly string _connectionString;

    public UserMfaRepository(string connectionString) => _connectionString = connectionString;

    public async Task<UserMfaSettings?> GetAsync(Guid userId, Guid tenantId)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            SELECT user_id AS UserId, tenant_id AS TenantId, secret_protected AS SecretProtected,
                   is_enabled AS IsEnabled, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM user_mfa WHERE user_id = @UserId AND tenant_id = @TenantId";
        return await connection.QueryFirstOrDefaultAsync<UserMfaSettings>(sql, new { UserId = userId, TenantId = tenantId });
    }

    public async Task UpsertAsync(UserMfaSettings settings)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            INSERT INTO user_mfa (user_id, tenant_id, secret_protected, is_enabled, created_at, updated_at)
            VALUES (@UserId, @TenantId, @SecretProtected, @IsEnabled, NOW(), NOW())
            ON CONFLICT (user_id, tenant_id) DO UPDATE SET
                secret_protected = EXCLUDED.secret_protected,
                is_enabled = EXCLUDED.is_enabled,
                updated_at = NOW()";
        await connection.ExecuteAsync(sql, settings);
    }

    public async Task SetEnabledAsync(Guid userId, Guid tenantId, bool enabled)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        const string sql = @"
            UPDATE user_mfa SET is_enabled = @Enabled, updated_at = NOW()
            WHERE user_id = @UserId AND tenant_id = @TenantId";
        await connection.ExecuteAsync(sql, new { UserId = userId, TenantId = tenantId, Enabled = enabled });
    }
}
