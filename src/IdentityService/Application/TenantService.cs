using Dapper;
using IdentityService.Domain;
using IdentityService.DTOs;
using IdentityService.Repositories;
using Npgsql;
using Shared.Common.Helpers;

namespace IdentityService.Application;

public interface ITenantService
{
    Task<TenantRegistrationResult> RegisterHospitalAsync(RegisterHospitalRequest request);
    Task<Tenant?> GetByCodeAsync(string code);
    Task<Tenant?> GetByIdAsync(Guid id);
}

public sealed class TenantRegistrationResult
{
    public Guid TenantId { get; init; }
    public string TenantCode { get; init; } = string.Empty;
    public Guid AdminUserId { get; init; }
}

public class TenantService : ITenantService
{
    private static readonly Guid SystemTenantId = Guid.Parse("00000000-0000-0000-0000-000000000000");

    private readonly ITenantRepository _tenantRepository;
    private readonly string _connectionString;

    public TenantService(ITenantRepository tenantRepository, IConfiguration configuration)
    {
        _tenantRepository = tenantRepository;
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public Task<Tenant?> GetByCodeAsync(string code) => _tenantRepository.GetByCodeAsync(code);

    public Task<Tenant?> GetByIdAsync(Guid id) => _tenantRepository.GetByIdAsync(id);

    public async Task<TenantRegistrationResult> RegisterHospitalAsync(RegisterHospitalRequest request)
    {
        var code = request.HospitalCode.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || code.Length < 3)
            throw new ArgumentException("Hospital code must be at least 3 characters.");

        if (await _tenantRepository.GetByCodeAsync(code) != null)
            throw new InvalidOperationException("A tenant with this code already exists.");

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var tx = await connection.BeginTransactionAsync();

        var tenantId = Guid.NewGuid();
        const string insertTenant = @"
            INSERT INTO tenants (id, name, code, primary_email, timezone, is_active, created_at, is_deleted)
            VALUES (@Id, @Name, @Code, @Email, 'UTC', true, NOW(), false)";
        await connection.ExecuteAsync(insertTenant, new
        {
            Id = tenantId,
            Name = request.HospitalName,
            Code = code,
            Email = request.Email
        }, tx);

        var copied = await connection.ExecuteAsync(@"
            INSERT INTO password_policies (id, tenant_id, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, max_failed_attempts, lockout_duration_minutes, password_expiry_days, created_at, is_deleted)
            SELECT uuid_generate_v4(), @TenantId, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, max_failed_attempts, lockout_duration_minutes, password_expiry_days, NOW(), false
            FROM password_policies WHERE tenant_id = @SystemId AND is_deleted = false
            LIMIT 1",
            new { TenantId = tenantId, SystemId = SystemTenantId }, tx);

        if (copied == 0)
        {
            await connection.ExecuteAsync(@"
                INSERT INTO password_policies (id, tenant_id, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, max_failed_attempts, lockout_duration_minutes, password_expiry_days, created_at, is_deleted)
                VALUES (uuid_generate_v4(), @TenantId, 8, true, true, true, false, 5, 30, 90, NOW(), false)",
                new { TenantId = tenantId }, tx);
        }

        var templateRoles = (await connection.QueryAsync<(Guid Id, string Name, string? Description)>(
            "SELECT id, name, description FROM roles WHERE tenant_id = @T AND is_deleted = false ORDER BY name",
            new { T = SystemTenantId }, tx)).ToList();

        if (templateRoles.Count == 0)
            throw new InvalidOperationException(
                "System tenant has no role templates. Run identity migrations and seed scripts (1.00+) first.");

        var oldToNew = new Dictionary<Guid, Guid>();
        foreach (var tr in templateRoles)
        {
            var newRoleId = Guid.NewGuid();
            oldToNew[tr.Id] = newRoleId;
            await connection.ExecuteAsync(@"
                INSERT INTO roles (id, tenant_id, name, description, created_at, is_deleted)
                VALUES (@Id, @TenantId, @Name, @Desc, NOW(), false)",
                new { Id = newRoleId, TenantId = tenantId, Name = tr.Name, Desc = tr.Description ?? "" }, tx);
        }

        foreach (var kv in oldToNew)
        {
            var permIds = await connection.QueryAsync<Guid>(
                "SELECT permission_id FROM role_permissions WHERE role_id = @R AND is_deleted = false",
                new { R = kv.Key }, tx);
            foreach (var pid in permIds)
            {
                await connection.ExecuteAsync(@"
                    INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
                    VALUES (uuid_generate_v4(), @Rid, @Pid, NOW(), false)
                    ON CONFLICT (role_id, permission_id) DO NOTHING",
                    new { Rid = kv.Value, Pid = pid }, tx);
            }
        }

        var adminRoleId = await connection.QueryFirstAsync<Guid>(
            "SELECT id FROM roles WHERE tenant_id = @T AND name = 'HospitalAdmin' AND is_deleted = false",
            new { T = tenantId }, tx);

        var adminUserId = Guid.NewGuid();
        var passwordHash = PasswordHasher.HashPassword(request.Password);
        await connection.ExecuteAsync(@"
            INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone_number, role_id, is_active, password_changed_at, force_password_change, created_at, is_deleted)
            VALUES (@Id, @TenantId, @Email, @Hash, @Fn, @Ln, @Phone, @RoleId, true, NOW(), false, NOW(), false)",
            new
            {
                Id = adminUserId,
                TenantId = tenantId,
                Email = request.Email.Trim().ToLowerInvariant(),
                Hash = passwordHash,
                Fn = request.AdminFirstName,
                Ln = request.AdminLastName,
                Phone = request.PhoneNumber ?? "",
                RoleId = adminRoleId
            }, tx);

        await tx.CommitAsync();

        return new TenantRegistrationResult
        {
            TenantId = tenantId,
            TenantCode = code,
            AdminUserId = adminUserId
        };
    }
}
