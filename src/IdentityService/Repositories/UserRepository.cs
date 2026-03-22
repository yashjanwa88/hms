using Dapper;
using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, Guid tenantId);
    Task<User?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(User user);
    Task<bool> UpdateLastLoginAsync(Guid userId, Guid tenantId);
    Task<IEnumerable<User>> GetAllAsync(Guid tenantId);
    Task<IEnumerable<User>> GetAllByTenantAsync(Guid tenantId);
    Task<bool> IncrementFailedAttemptsAsync(Guid userId, Guid tenantId, int maxAttempts, int lockoutMinutes);
    Task<bool> ResetFailedAttemptsAsync(Guid userId, Guid tenantId);
    Task<bool> UpdatePasswordHashAsync(Guid userId, Guid tenantId, string passwordHash);
    Task<bool> AdminSetPasswordAsync(Guid userId, Guid tenantId, string passwordHash, bool forcePasswordChangeOnNextLogin);
}

public class UserRepository : BaseRepository<User>, IUserRepository
{
    protected override string TableName => "users";

    public UserRepository(string connectionString) : base(connectionString) { }

    public override async Task<Guid> CreateAsync(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.UtcNow;
        user.IsDeleted = false;

        using var connection = CreateConnection();
        var sql = @"INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone_number, role_id, is_active, created_at, created_by, is_deleted) 
                    VALUES (@Id, @TenantId, @Email, @PasswordHash, @FirstName, @LastName, @PhoneNumber, @RoleId, @IsActive, @CreatedAt, @CreatedBy, @IsDeleted)";
        await connection.ExecuteAsync(sql, user);
        return user.Id;
    }

    public async Task<User?> GetByEmailAsync(string email, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT id as Id, tenant_id as TenantId, email as Email, password_hash as PasswordHash, first_name as FirstName, last_name as LastName, phone_number as PhoneNumber, role_id as RoleId, is_active as IsActive, last_login_at as LastLoginAt, failed_login_attempts as FailedLoginAttempts, locked_until as LockedUntil, password_changed_at as PasswordChangedAt, force_password_change as ForcePasswordChange, created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted FROM users WHERE email = @Email AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email, TenantId = tenantId });
    }

    public async Task<bool> UpdateLastLoginAsync(Guid userId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "UPDATE users SET last_login_at = @LastLoginAt WHERE id = @UserId AND tenant_id = @TenantId";
        var result = await connection.ExecuteAsync(sql, new { UserId = userId, TenantId = tenantId, LastLoginAt = DateTime.UtcNow });
        return result > 0;
    }

    public async Task<IEnumerable<User>> GetAllByTenantAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT id as Id, tenant_id as TenantId, email as Email, password_hash as PasswordHash, first_name as FirstName, last_name as LastName, phone_number as PhoneNumber, role_id as RoleId, is_active as IsActive, last_login_at as LastLoginAt, failed_login_attempts as FailedLoginAttempts, locked_until as LockedUntil, password_changed_at as PasswordChangedAt, force_password_change as ForcePasswordChange, created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted FROM users WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY created_at DESC";
        return await connection.QueryAsync<User>(sql, new { TenantId = tenantId });
    }

    public async Task<bool> IncrementFailedAttemptsAsync(Guid userId, Guid tenantId, int maxAttempts, int lockoutMinutes)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE users SET 
                failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE 
                    WHEN failed_login_attempts + 1 >= @MaxAttempts 
                    THEN NOW() + make_interval(mins => @LockoutMinutes)
                    ELSE locked_until 
                END,
                updated_at = NOW()
            WHERE id = @UserId AND tenant_id = @TenantId";
        
        var result = await connection.ExecuteAsync(sql, new { 
            UserId = userId, 
            TenantId = tenantId, 
            MaxAttempts = maxAttempts, 
            LockoutMinutes = lockoutMinutes 
        });
        return result > 0;
    }

    public async Task<bool> ResetFailedAttemptsAsync(Guid userId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE users SET 
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = @UserId AND tenant_id = @TenantId";
        
        var result = await connection.ExecuteAsync(sql, new { UserId = userId, TenantId = tenantId });
        return result > 0;
    }

    public async Task<bool> UpdatePasswordHashAsync(Guid userId, Guid tenantId, string passwordHash)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE users SET 
                password_hash = @PasswordHash,
                password_changed_at = NOW(),
                force_password_change = FALSE,
                updated_at = NOW()
            WHERE id = @UserId AND tenant_id = @TenantId";
        var result = await connection.ExecuteAsync(sql, new { UserId = userId, TenantId = tenantId, PasswordHash = passwordHash });
        return result > 0;
    }

    public async Task<bool> AdminSetPasswordAsync(Guid userId, Guid tenantId, string passwordHash, bool forcePasswordChangeOnNextLogin)
    {
        using var connection = CreateConnection();
        const string sql = @"
            UPDATE users SET
                password_hash = @PasswordHash,
                password_changed_at = NOW(),
                force_password_change = @ForcePasswordChange,
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = @UserId AND tenant_id = @TenantId AND is_deleted = false";
        var n = await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            TenantId = tenantId,
            PasswordHash = passwordHash,
            ForcePasswordChange = forcePasswordChangeOnNextLogin
        });
        return n > 0;
    }
}
