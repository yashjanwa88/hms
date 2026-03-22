using Dapper;
using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<Guid> CreateAsync(RefreshToken refreshToken);
    Task<bool> RevokeAsync(string token);
    Task<int> RevokeAllForUserAsync(Guid userId, Guid tenantId);
    Task<bool> TouchLastUsedAsync(string token);
    Task<IReadOnlyList<RefreshToken>> ListActiveForUserAsync(Guid userId, Guid tenantId);
    Task<bool> RevokeByIdForUserAsync(Guid sessionId, Guid userId, Guid tenantId);
}

public class RefreshTokenRepository : BaseRepository<RefreshToken>, IRefreshTokenRepository
{
    protected override string TableName => "refresh_tokens";

    public RefreshTokenRepository(string connectionString) : base(connectionString) { }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM refresh_tokens WHERE token = @Token AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<RefreshToken>(sql, new { Token = token });
    }

    public async Task<bool> RevokeAsync(string token)
    {
        using var connection = CreateConnection();
        var sql = "UPDATE refresh_tokens SET is_revoked = true WHERE token = @Token";
        var result = await connection.ExecuteAsync(sql, new { Token = token });
        return result > 0;
    }

    public async Task<int> RevokeAllForUserAsync(Guid userId, Guid tenantId)
    {
        using var connection = CreateConnection();
        const string sql = @"
            UPDATE refresh_tokens SET is_revoked = true, updated_at = NOW()
            WHERE user_id = @UserId AND tenant_id = @TenantId AND is_deleted = false AND is_revoked = false";
        return await connection.ExecuteAsync(sql, new { UserId = userId, TenantId = tenantId });
    }

    public async Task<bool> TouchLastUsedAsync(string token)
    {
        using var connection = CreateConnection();
        const string sql = @"
            UPDATE refresh_tokens SET last_used_at = NOW(), updated_at = NOW()
            WHERE token = @Token AND is_deleted = false AND is_revoked = false";
        var n = await connection.ExecuteAsync(sql, new { Token = token });
        return n > 0;
    }

    public async Task<IReadOnlyList<RefreshToken>> ListActiveForUserAsync(Guid userId, Guid tenantId)
    {
        using var connection = CreateConnection();
        const string sql = @"
            SELECT id AS Id, tenant_id AS TenantId, user_id AS UserId, token AS Token, expires_at AS ExpiresAt,
                   is_revoked AS IsRevoked, ip_address AS IpAddress, user_agent AS UserAgent, last_used_at AS LastUsedAt,
                   created_at AS CreatedAt, created_by AS CreatedBy, updated_at AS UpdatedAt, updated_by AS UpdatedBy, is_deleted AS IsDeleted
            FROM refresh_tokens
            WHERE user_id = @UserId AND tenant_id = @TenantId AND is_deleted = false AND is_revoked = false
              AND expires_at > NOW()
            ORDER BY created_at DESC";
        var rows = await connection.QueryAsync<RefreshToken>(sql, new { UserId = userId, TenantId = tenantId });
        return rows.ToList();
    }

    public async Task<bool> RevokeByIdForUserAsync(Guid sessionId, Guid userId, Guid tenantId)
    {
        using var connection = CreateConnection();
        const string sql = @"
            UPDATE refresh_tokens SET is_revoked = true, updated_at = NOW()
            WHERE id = @Id AND user_id = @UserId AND tenant_id = @TenantId AND is_deleted = false";
        var n = await connection.ExecuteAsync(sql, new { Id = sessionId, UserId = userId, TenantId = tenantId });
        return n > 0;
    }
}
