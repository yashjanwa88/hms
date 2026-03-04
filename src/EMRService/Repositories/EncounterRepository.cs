using Dapper;
using EMRService.Domain;
using Npgsql;

namespace EMRService.Repositories;

public class EncounterRepository : IEncounterRepository
{
    private readonly string _connectionString;

    public EncounterRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<Encounter> CreateAsync(Encounter encounter)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO encounters (id, tenant_id, encounter_number, patient_id, doctor_id, 
                encounter_type, encounter_date, status, chief_complaint, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @EncounterNumber, @PatientId, @DoctorId, 
                @EncounterType, @EncounterDate, @Status, @ChiefComplaint, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<Encounter>(sql, encounter);
    }

    public async Task<Encounter?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM encounters 
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        
        return await connection.QuerySingleOrDefaultAsync<Encounter>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<Encounter>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM encounters 
            WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY encounter_date DESC";
        
        var result = await connection.QueryAsync<Encounter>(sql, new { PatientId = patientId, TenantId = tenantId });
        return result.ToList();
    }

    public async Task<bool> CloseEncounterAsync(Guid id, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            UPDATE encounters 
            SET status = 'Closed', updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId AND status = 'Open' AND is_deleted = false";
        
        var rows = await connection.ExecuteAsync(sql, new { 
            Id = id, 
            TenantId = tenantId, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = userId 
        });
        
        return rows > 0;
    }

    public async Task<string> GenerateEncounterNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        var year = DateTime.UtcNow.Year;
        
        const string sql = @"
            INSERT INTO emr_sequences (tenant_id, year, last_sequence)
            VALUES (@TenantId, @Year, 1)
            ON CONFLICT (tenant_id, year) 
            DO UPDATE SET last_sequence = emr_sequences.last_sequence + 1
            RETURNING last_sequence";
        
        var sequence = await connection.QuerySingleAsync<int>(sql, new { TenantId = tenantId, Year = year });
        
        return $"ENC-{tenantCode}-{year}-{sequence:D6}";
    }
}
