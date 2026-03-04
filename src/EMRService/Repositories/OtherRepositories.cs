using Dapper;
using EMRService.Domain;
using Npgsql;

namespace EMRService.Repositories;

public class ClinicalNoteRepository : IClinicalNoteRepository
{
    private readonly string _connectionString;

    public ClinicalNoteRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<ClinicalNote> CreateAsync(ClinicalNote note)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO clinical_notes (id, tenant_id, encounter_id, note_type, subjective, 
                objective, assessment, plan, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @EncounterId, @NoteType, @Subjective, 
                @Objective, @Assessment, @Plan, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<ClinicalNote>(sql, note);
    }

    public async Task<List<ClinicalNote>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM clinical_notes 
            WHERE encounter_id = @EncounterId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY created_at DESC";
        
        var result = await connection.QueryAsync<ClinicalNote>(sql, new { EncounterId = encounterId, TenantId = tenantId });
        return result.ToList();
    }
}

public class DiagnosisRepository : IDiagnosisRepository
{
    private readonly string _connectionString;

    public DiagnosisRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<Diagnosis> CreateAsync(Diagnosis diagnosis)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO diagnoses (id, tenant_id, encounter_id, icd10_code, diagnosis_name, 
                diagnosis_type, notes, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @EncounterId, @ICD10Code, @DiagnosisName, 
                @DiagnosisType, @Notes, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<Diagnosis>(sql, diagnosis);
    }

    public async Task<List<Diagnosis>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM diagnoses 
            WHERE encounter_id = @EncounterId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY diagnosis_type DESC, created_at";
        
        var result = await connection.QueryAsync<Diagnosis>(sql, new { EncounterId = encounterId, TenantId = tenantId });
        return result.ToList();
    }

    public async Task<bool> HasPrimaryDiagnosisAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT COUNT(*) FROM diagnoses 
            WHERE encounter_id = @EncounterId AND tenant_id = @TenantId 
            AND diagnosis_type = 'Primary' AND is_deleted = false";
        
        var count = await connection.ExecuteScalarAsync<int>(sql, new { EncounterId = encounterId, TenantId = tenantId });
        return count > 0;
    }
}

public class VitalRepository : IVitalRepository
{
    private readonly string _connectionString;

    public VitalRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<Vital> CreateAsync(Vital vital)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO vitals (id, tenant_id, encounter_id, temperature, pulse_rate, 
                respiratory_rate, blood_pressure, height, weight, bmi, oxygen_saturation, 
                recorded_at, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @EncounterId, @Temperature, @PulseRate, 
                @RespiratoryRate, @BloodPressure, @Height, @Weight, @BMI, @OxygenSaturation, 
                @RecordedAt, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<Vital>(sql, vital);
    }

    public async Task<List<Vital>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM vitals 
            WHERE encounter_id = @EncounterId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY recorded_at DESC";
        
        var result = await connection.QueryAsync<Vital>(sql, new { EncounterId = encounterId, TenantId = tenantId });
        return result.ToList();
    }
}

public class AllergyRepository : IAllergyRepository
{
    private readonly string _connectionString;

    public AllergyRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<Allergy> CreateAsync(Allergy allergy)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO allergies (id, tenant_id, patient_id, allergy_type, allergen_name, 
                severity, reaction, onset_date, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @PatientId, @AllergyType, @AllergenName, 
                @Severity, @Reaction, @OnsetDate, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<Allergy>(sql, allergy);
    }

    public async Task<List<Allergy>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM allergies 
            WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY severity DESC, created_at DESC";
        
        var result = await connection.QueryAsync<Allergy>(sql, new { PatientId = patientId, TenantId = tenantId });
        return result.ToList();
    }
}

public class ProcedureRepository : IProcedureRepository
{
    private readonly string _connectionString;

    public ProcedureRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("EMRDatabase")!;
    }

    public async Task<Procedure> CreateAsync(Procedure procedure)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            INSERT INTO procedures (id, tenant_id, encounter_id, procedure_code, procedure_name, 
                procedure_date, notes, status, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @EncounterId, @ProcedureCode, @ProcedureName, 
                @ProcedureDate, @Notes, @Status, @CreatedAt, @CreatedBy, @IsDeleted)
            RETURNING *";
        
        return await connection.QuerySingleAsync<Procedure>(sql, procedure);
    }

    public async Task<List<Procedure>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            SELECT * FROM procedures 
            WHERE encounter_id = @EncounterId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY procedure_date DESC";
        
        var result = await connection.QueryAsync<Procedure>(sql, new { EncounterId = encounterId, TenantId = tenantId });
        return result.ToList();
    }
}
