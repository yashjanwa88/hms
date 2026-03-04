using Dapper;
using EncounterService.Domain;
using EncounterService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace EncounterService.Repositories;

public interface IEncounterRepository
{
    Task<Guid> CreateAsync(Encounter encounter);
    Task<Encounter?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Encounter?> GetByNumberAsync(string encounterNumber, Guid tenantId);
    Task<bool> UpdateStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy);
    Task<PagedResult<Encounter>> SearchAsync(EncounterSearchRequest request, Guid tenantId);
    Task<string> GenerateEncounterNumberAsync(Guid tenantId, string tenantCode);
    Task<EncounterCountResponse> GetCountByPatientAsync(Guid patientId, Guid tenantId);
}

public class EncounterRepository : BaseRepository<Encounter>, IEncounterRepository
{
    protected override string TableName => "encounters";

    public EncounterRepository(string connectionString) : base(connectionString) { }

    public override async Task<Guid> CreateAsync(Encounter encounter)
    {
        encounter.Id = Guid.NewGuid();
        encounter.EncounterDate = DateTime.UtcNow;
        encounter.CreatedAt = DateTime.UtcNow;
        encounter.IsDeleted = false;
        encounter.Status = "Active";

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO encounters (
                id, tenant_id, patient_id, doctor_id, encounter_number,
                visit_type, department, chief_complaint, status,
                encounter_date, created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @PatientId, @DoctorId, @EncounterNumber,
                @VisitType, @Department, @ChiefComplaint, @Status,
                @EncounterDate, @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, encounter);
        return encounter.Id;
    }

    public async Task<Encounter?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, doctor_id as DoctorId,
            encounter_number as EncounterNumber, visit_type as VisitType, department as Department,
            chief_complaint as ChiefComplaint, status as Status, encounter_date as EncounterDate,
            completed_at as CompletedAt, created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM encounters WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Encounter>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<Encounter?> GetByNumberAsync(string encounterNumber, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, doctor_id as DoctorId,
            encounter_number as EncounterNumber, visit_type as VisitType, department as Department,
            chief_complaint as ChiefComplaint, status as Status, encounter_date as EncounterDate,
            completed_at as CompletedAt, created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM encounters WHERE encounter_number = @EncounterNumber AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Encounter>(sql, new { EncounterNumber = encounterNumber, TenantId = tenantId });
    }

    public async Task<bool> UpdateStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy)
    {
        using var connection = CreateConnection();
        var completedAt = status == "Completed" ? DateTime.UtcNow : (DateTime?)null;
        
        var sql = @"
            UPDATE encounters 
            SET status = @Status, 
                completed_at = @CompletedAt,
                updated_at = @UpdatedAt, 
                updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false AND status = 'Active'";

        var rows = await connection.ExecuteAsync(sql, new 
        { 
            Id = id, 
            Status = status, 
            CompletedAt = completedAt,
            TenantId = tenantId, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = updatedBy 
        });
        
        return rows > 0;
    }

    public async Task<PagedResult<Encounter>> SearchAsync(EncounterSearchRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var whereClause = "WHERE tenant_id = @TenantId AND is_deleted = false";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (request.PatientId.HasValue)
        {
            whereClause += " AND patient_id = @PatientId";
            parameters.Add("PatientId", request.PatientId.Value);
        }

        if (request.DoctorId.HasValue)
        {
            whereClause += " AND doctor_id = @DoctorId";
            parameters.Add("DoctorId", request.DoctorId.Value);
        }

        if (!string.IsNullOrEmpty(request.VisitType))
        {
            whereClause += " AND visit_type = @VisitType";
            parameters.Add("VisitType", request.VisitType);
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            whereClause += " AND status = @Status";
            parameters.Add("Status", request.Status);
        }

        if (request.FromDate.HasValue)
        {
            whereClause += " AND encounter_date >= @FromDate";
            parameters.Add("FromDate", request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            whereClause += " AND encounter_date <= @ToDate";
            parameters.Add("ToDate", request.ToDate.Value);
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $@"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, doctor_id as DoctorId,
            encounter_number as EncounterNumber, visit_type as VisitType, department as Department,
            chief_complaint as ChiefComplaint, status as Status, encounter_date as EncounterDate,
            completed_at as CompletedAt, created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM encounters {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        
        var countSql = $"SELECT COUNT(*) FROM encounters {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Encounter>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Encounter>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<string> GenerateEncounterNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            var year = DateTime.UtcNow.Year;
            
            var seqSql = @"
                INSERT INTO encounter_sequences (id, tenant_id, tenant_code, year, last_sequence, created_at, is_deleted)
                VALUES (uuid_generate_v4(), @TenantId, @TenantCode, @Year, 1, NOW(), false)
                ON CONFLICT (tenant_id, year) 
                DO UPDATE SET 
                    last_sequence = encounter_sequences.last_sequence + 1,
                    updated_at = NOW()
                RETURNING last_sequence";
            
            var sequence = await connection.ExecuteScalarAsync<int>(seqSql, new { TenantId = tenantId, TenantCode = tenantCode, Year = year }, transaction);
            
            transaction.Commit();
            
            return $"ENC-{tenantCode}-{year}-{sequence:D6}";
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<EncounterCountResponse> GetCountByPatientAsync(Guid patientId, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                COUNT(*) FILTER (WHERE is_deleted = false) as TotalEncounters,
                COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as ActiveEncounters,
                COUNT(*) FILTER (WHERE status = 'Completed' AND is_deleted = false) as CompletedEncounters
            FROM encounters
            WHERE tenant_id = @TenantId AND patient_id = @PatientId";

        return await connection.QueryFirstOrDefaultAsync<EncounterCountResponse>(sql, new { TenantId = tenantId, PatientId = patientId }) 
            ?? new EncounterCountResponse();
    }
}
