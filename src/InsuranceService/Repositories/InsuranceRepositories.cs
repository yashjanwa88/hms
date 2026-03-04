using Dapper;
using InsuranceService.Domain;
using Npgsql;
using Shared.Common.Helpers;
using Shared.Common.Interfaces;

namespace InsuranceService.Repositories;

public interface IInsuranceProviderRepository : IBaseRepository<InsuranceProvider>
{
    Task<List<InsuranceProvider>> GetActiveProvidersAsync(Guid tenantId);
    Task<InsuranceProvider?> GetByCodeAsync(string providerCode, Guid tenantId);
}

public class InsuranceProviderRepository : BaseRepository<InsuranceProvider>, IInsuranceProviderRepository
{
    public InsuranceProviderRepository(string connectionString) : base(connectionString, "insurance_providers") { }

    public async Task<List<InsuranceProvider>> GetActiveProvidersAsync(Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_providers WHERE tenant_id = @TenantId AND is_active = true AND is_deleted = false ORDER BY provider_name";
        var result = await connection.QueryAsync<InsuranceProvider>(sql, new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task<InsuranceProvider?> GetByCodeAsync(string providerCode, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_providers WHERE provider_code = @ProviderCode AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<InsuranceProvider>(sql, new { ProviderCode = providerCode, TenantId = tenantId });
    }
}

public interface IInsurancePolicyRepository : IBaseRepository<InsurancePolicy>
{
    Task<List<InsurancePolicy>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<InsurancePolicy?> GetByPolicyNumberAsync(string policyNumber, Guid tenantId);
    Task<bool> UpdateUsedAmountAsync(Guid policyId, decimal amount, Guid tenantId, Guid updatedBy);
}

public class InsurancePolicyRepository : BaseRepository<InsurancePolicy>, IInsurancePolicyRepository
{
    public InsurancePolicyRepository(string connectionString) : base(connectionString, "insurance_policies") { }

    public async Task<List<InsurancePolicy>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_policies WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false ORDER BY created_at DESC";
        var result = await connection.QueryAsync<InsurancePolicy>(sql, new { PatientId = patientId, TenantId = tenantId });
        return result.ToList();
    }

    public async Task<InsurancePolicy?> GetByPolicyNumberAsync(string policyNumber, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_policies WHERE policy_number = @PolicyNumber AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<InsurancePolicy>(sql, new { PolicyNumber = policyNumber, TenantId = tenantId });
    }

    public async Task<bool> UpdateUsedAmountAsync(Guid policyId, decimal amount, Guid tenantId, Guid updatedBy)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
            UPDATE insurance_policies 
            SET used_amount = used_amount + @Amount,
                available_amount = coverage_amount - (used_amount + @Amount),
                updated_at = CURRENT_TIMESTAMP,
                updated_by = @UpdatedBy
            WHERE id = @PolicyId AND tenant_id = @TenantId AND is_deleted = false";
        var rows = await connection.ExecuteAsync(sql, new { PolicyId = policyId, Amount = amount, TenantId = tenantId, UpdatedBy = updatedBy });
        return rows > 0;
    }
}

public interface IPreAuthorizationRepository : IBaseRepository<PreAuthorization>
{
    Task<string> GeneratePreAuthNumberAsync(Guid tenantId, string tenantCode);
    Task<List<PreAuthorization>> GetByPolicyIdAsync(Guid policyId, Guid tenantId);
}

public class PreAuthorizationRepository : BaseRepository<PreAuthorization>, IPreAuthorizationRepository
{
    public PreAuthorizationRepository(string connectionString) : base(connectionString, "pre_authorizations") { }

    public async Task<string> GeneratePreAuthNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var year = DateTime.UtcNow.Year;
        var sql = "SELECT COUNT(*) FROM pre_authorizations WHERE tenant_id = @TenantId AND EXTRACT(YEAR FROM request_date) = @Year";
        var count = await connection.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Year = year });
        return $"PA-{tenantCode}-{year}-{(count + 1):D6}";
    }

    public async Task<List<PreAuthorization>> GetByPolicyIdAsync(Guid policyId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM pre_authorizations WHERE policy_id = @PolicyId AND tenant_id = @TenantId AND is_deleted = false ORDER BY request_date DESC";
        var result = await connection.QueryAsync<PreAuthorization>(sql, new { PolicyId = policyId, TenantId = tenantId });
        return result.ToList();
    }
}

public interface IInsuranceClaimRepository : IBaseRepository<InsuranceClaim>
{
    Task<string> GenerateClaimNumberAsync(Guid tenantId, string tenantCode);
    Task<List<InsuranceClaim>> GetByInvoiceIdAsync(Guid invoiceId, Guid tenantId);
    Task<List<InsuranceClaim>> GetByPolicyIdAsync(Guid policyId, Guid tenantId);
}

public class InsuranceClaimRepository : BaseRepository<InsuranceClaim>, IInsuranceClaimRepository
{
    public InsuranceClaimRepository(string connectionString) : base(connectionString, "insurance_claims") { }

    public async Task<string> GenerateClaimNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var year = DateTime.UtcNow.Year;
        var sql = @"
            INSERT INTO insurance_sequences (tenant_id, year, last_sequence, created_by, created_at)
            VALUES (@TenantId, @Year, 1, @TenantId, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, year) 
            DO UPDATE SET last_sequence = insurance_sequences.last_sequence + 1, updated_at = CURRENT_TIMESTAMP
            RETURNING last_sequence";
        
        var sequence = await connection.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Year = year });
        return $"CLM-{tenantCode}-{year}-{sequence:D6}";
    }

    public async Task<List<InsuranceClaim>> GetByInvoiceIdAsync(Guid invoiceId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_claims WHERE invoice_id = @InvoiceId AND tenant_id = @TenantId AND is_deleted = false ORDER BY claim_date DESC";
        var result = await connection.QueryAsync<InsuranceClaim>(sql, new { InvoiceId = invoiceId, TenantId = tenantId });
        return result.ToList();
    }

    public async Task<List<InsuranceClaim>> GetByPolicyIdAsync(Guid policyId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM insurance_claims WHERE policy_id = @PolicyId AND tenant_id = @TenantId AND is_deleted = false ORDER BY claim_date DESC";
        var result = await connection.QueryAsync<InsuranceClaim>(sql, new { PolicyId = policyId, TenantId = tenantId });
        return result.ToList();
    }
}

public interface IClaimSettlementRepository : IBaseRepository<ClaimSettlement>
{
    Task<string> GenerateSettlementNumberAsync(Guid tenantId, string tenantCode);
    Task<ClaimSettlement?> GetByClaimIdAsync(Guid claimId, Guid tenantId);
}

public class ClaimSettlementRepository : BaseRepository<ClaimSettlement>, IClaimSettlementRepository
{
    public ClaimSettlementRepository(string connectionString) : base(connectionString, "claim_settlements") { }

    public async Task<string> GenerateSettlementNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var year = DateTime.UtcNow.Year;
        var sql = "SELECT COUNT(*) FROM claim_settlements WHERE tenant_id = @TenantId AND EXTRACT(YEAR FROM settlement_date) = @Year";
        var count = await connection.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Year = year });
        return $"STL-{tenantCode}-{year}-{(count + 1):D6}";
    }

    public async Task<ClaimSettlement?> GetByClaimIdAsync(Guid claimId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM claim_settlements WHERE claim_id = @ClaimId AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<ClaimSettlement>(sql, new { ClaimId = claimId, TenantId = tenantId });
    }
}

