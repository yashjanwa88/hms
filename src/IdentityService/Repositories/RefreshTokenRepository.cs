using Dapper;
using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<Guid> CreateAsync(RefreshToken refreshToken);
    Task<bool> RevokeAsync(string token);
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
}
