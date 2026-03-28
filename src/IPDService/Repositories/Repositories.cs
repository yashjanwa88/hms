using Dapper;
using IPDService.Domain;
using Shared.Common.Helpers;
using System.Data;
using Npgsql;

namespace IPDService.Repositories;

public class WardRepository : BaseRepository<Ward>, IWardRepository
{
    protected override string TableName => "wards";
    public WardRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<Ward>> GetAllWardsAsync(Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Ward>(
            "SELECT * FROM wards WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }
}

public class BedRepository : BaseRepository<Bed>, IBedRepository
{
    protected override string TableName => "beds";
    public BedRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<Bed>> GetBedsByWardIdAsync(Guid tenantId, Guid wardId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Bed>(
            "SELECT * FROM beds WHERE tenant_id = @TenantId AND ward_id = @WardId AND is_deleted = FALSE",
            new { TenantId = tenantId, WardId = wardId });
    }
}

public class AdmissionRepository : BaseRepository<Admission>, IAdmissionRepository
{
    protected override string TableName => "admissions";
    public AdmissionRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<Admission>> GetActiveAdmissionsAsync(Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Admission>(
            "SELECT * FROM admissions WHERE tenant_id = @TenantId AND status = 'Admitted' AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }

    public async Task<Admission?> GetActiveAdmissionForPatientAsync(Guid tenantId, Guid patientId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Admission>(
            "SELECT * FROM admissions WHERE tenant_id = @TenantId AND patient_id = @PatientId AND status = 'Admitted' AND is_deleted = FALSE",
            new { TenantId = tenantId, PatientId = patientId });
    }
}
