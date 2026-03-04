using Dapper;
using IdentityService.Domain;
using Npgsql;

namespace IdentityService.Repositories;

public interface IPasswordPolicyRepository
{
    Task<PasswordPolicy?> GetByTenantAsync(Guid tenantId);
    Task<Guid> CreateAsync(PasswordPolicy policy);
    Task<bool> UpdateAsync(PasswordPolicy policy);
}

public class PasswordPolicyRepository : IPasswordPolicyRepository
{
    private readonly string _connectionString;

    public PasswordPolicyRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<PasswordPolicy?> GetByTenantAsync(Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        
        var sql = @"
            SELECT 
                id as Id, tenant_id as TenantId, min_length as MinLength,
                require_uppercase as RequireUppercase, require_lowercase as RequireLowercase,
                require_numbers as RequireNumbers, require_special_chars as RequireSpecialChars,
                max_failed_attempts as MaxFailedAttempts, lockout_duration_minutes as LockoutDurationMinutes,
                password_expiry_days as PasswordExpiryDays, created_at as CreatedAt,
                updated_at as UpdatedAt, is_deleted as IsDeleted
            FROM password_policies 
            WHERE tenant_id = @TenantId AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PasswordPolicy>(sql, new { TenantId = tenantId });
    }

    public async Task<Guid> CreateAsync(PasswordPolicy policy)
    {
        policy.Id = Guid.NewGuid();
        policy.CreatedAt = DateTime.UtcNow;
        policy.IsDeleted = false;

        using var conn = new NpgsqlConnection(_connectionString);
        
        var sql = @"
            INSERT INTO password_policies (
                id, tenant_id, min_length, require_uppercase, require_lowercase,
                require_numbers, require_special_chars, max_failed_attempts,
                lockout_duration_minutes, password_expiry_days, created_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @MinLength, @RequireUppercase, @RequireLowercase,
                @RequireNumbers, @RequireSpecialChars, @MaxFailedAttempts,
                @LockoutDurationMinutes, @PasswordExpiryDays, @CreatedAt, @IsDeleted
            )";

        await conn.ExecuteAsync(sql, policy);
        return policy.Id;
    }

    public async Task<bool> UpdateAsync(PasswordPolicy policy)
    {
        policy.UpdatedAt = DateTime.UtcNow;

        using var conn = new NpgsqlConnection(_connectionString);
        
        var sql = @"
            UPDATE password_policies SET
                min_length = @MinLength, require_uppercase = @RequireUppercase,
                require_lowercase = @RequireLowercase, require_numbers = @RequireNumbers,
                require_special_chars = @RequireSpecialChars, max_failed_attempts = @MaxFailedAttempts,
                lockout_duration_minutes = @LockoutDurationMinutes, password_expiry_days = @PasswordExpiryDays,
                updated_at = @UpdatedAt
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";

        var rows = await conn.ExecuteAsync(sql, policy);
        return rows > 0;
    }
}