using Dapper;
using VisitService.Domain;
using VisitService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace VisitService.Repositories;

public interface IVisitRepository
{
    Task<Guid> CreateAsync(Visit visit);
    Task<Visit?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Visit?> GetByVisitNumberAsync(string visitNumber, Guid tenantId);
    Task<bool> UpdateAsync(Visit visit);
    Task<bool> UpdateStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy);
    Task<PagedResult<Visit>> SearchAsync(VisitSearchRequest request, Guid tenantId);
    Task<List<Visit>> GetPatientVisitHistoryAsync(Guid patientId, Guid tenantId, int limit = 10);
    Task<string> GenerateVisitNumberAsync(Guid tenantId, string tenantCode, string visitType);
    Task<bool> CheckInAsync(Guid visitId, Guid tenantId, Guid userId);
    Task<bool> CheckOutAsync(Guid visitId, Guid tenantId, Guid userId);
    Task<bool> ConvertToIPDAsync(Guid visitId, Guid ipdAdmissionId, Guid tenantId, Guid userId);
    Task<VisitStatsResponse> GetStatsAsync(Guid tenantId);
    Task<List<Visit>> GetActiveVisitsAsync(Guid tenantId);
}

public interface IVisitTimelineRepository
{
    Task<Guid> CreateAsync(VisitTimeline timeline);
    Task<List<VisitTimeline>> GetByVisitIdAsync(Guid visitId, Guid tenantId);
}

public class VisitRepository : BaseRepository<Visit>, IVisitRepository
{
    protected override string TableName => "visits";

    public VisitRepository(string connectionString) : base(connectionString) { }

    public override async Task<Guid> CreateAsync(Visit visit)
    {
        visit.Id = Guid.NewGuid();
        visit.VisitDateTime = DateTime.UtcNow;
        visit.CreatedAt = DateTime.UtcNow;
        visit.IsDeleted = false;
        visit.Status = "Waiting";

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO visits (
                id, tenant_id, visit_number, patient_id, patient_uhid, appointment_id,
                doctor_id, doctor_name, department, visit_type, priority, status,
                visit_date_time, chief_complaint, symptoms, is_emergency, consultation_fee,
                payment_status, created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitNumber, @PatientId, @PatientUHID, @AppointmentId,
                @DoctorId, @DoctorName, @Department, @VisitType, @Priority, @Status,
                @VisitDateTime, @ChiefComplaint, @Symptoms, @IsEmergency, @ConsultationFee,
                @PaymentStatus, @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, visit);
        return visit.Id;
    }

    public override async Task<Visit?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, visit_number as VisitNumber, patient_id as PatientId, 
                    patient_uhid as PatientUHID, appointment_id as AppointmentId, doctor_id as DoctorId, 
                    doctor_name as DoctorName, department as Department, visit_type as VisitType, 
                    priority as Priority, status as Status, visit_date_time as VisitDateTime, 
                    check_in_time as CheckInTime, check_out_time as CheckOutTime, chief_complaint as ChiefComplaint, 
                    symptoms as Symptoms, vital_signs as VitalSigns, diagnosis as Diagnosis, treatment as Treatment, 
                    prescription as Prescription, instructions as Instructions, follow_up_date as FollowUpDate, 
                    is_emergency as IsEmergency, is_ipd_converted as IsIPDConverted, ipd_admission_id as IPDAdmissionId, 
                    consultation_fee as ConsultationFee, payment_status as PaymentStatus, notes as Notes, 
                    created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
                    FROM visits WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Visit>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<Visit?> GetByVisitNumberAsync(string visitNumber, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, visit_number as VisitNumber, patient_id as PatientId, 
                    patient_uhid as PatientUHID, appointment_id as AppointmentId, doctor_id as DoctorId, 
                    doctor_name as DoctorName, department as Department, visit_type as VisitType, 
                    priority as Priority, status as Status, visit_date_time as VisitDateTime, 
                    check_in_time as CheckInTime, check_out_time as CheckOutTime, chief_complaint as ChiefComplaint, 
                    symptoms as Symptoms, vital_signs as VitalSigns, diagnosis as Diagnosis, treatment as Treatment, 
                    prescription as Prescription, instructions as Instructions, follow_up_date as FollowUpDate, 
                    is_emergency as IsEmergency, is_ipd_converted as IsIPDConverted, ipd_admission_id as IPDAdmissionId, 
                    consultation_fee as ConsultationFee, payment_status as PaymentStatus, notes as Notes, 
                    created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
                    FROM visits WHERE visit_number = @VisitNumber AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Visit>(sql, new { VisitNumber = visitNumber, TenantId = tenantId });
    }

    public async Task<bool> UpdateStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE visits 
            SET status = @Status, updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId";
        
        var rows = await connection.ExecuteAsync(sql, new 
        { 
            Id = id, 
            Status = status, 
            TenantId = tenantId, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = updatedBy 
        });
        return rows > 0;
    }

    public async Task<PagedResult<Visit>> SearchAsync(VisitSearchRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var selectSql = @"SELECT id as Id, tenant_id as TenantId, visit_number as VisitNumber, patient_id as PatientId, 
                    patient_uhid as PatientUHID, appointment_id as AppointmentId, doctor_id as DoctorId, 
                    doctor_name as DoctorName, department as Department, visit_type as VisitType, 
                    priority as Priority, status as Status, visit_date_time as VisitDateTime, 
                    check_in_time as CheckInTime, check_out_time as CheckOutTime, chief_complaint as ChiefComplaint, 
                    symptoms as Symptoms, vital_signs as VitalSigns, diagnosis as Diagnosis, treatment as Treatment, 
                    prescription as Prescription, instructions as Instructions, follow_up_date as FollowUpDate, 
                    is_emergency as IsEmergency, is_ipd_converted as IsIPDConverted, ipd_admission_id as IPDAdmissionId, 
                    consultation_fee as ConsultationFee, payment_status as PaymentStatus, notes as Notes, 
                    created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
                    FROM visits";
        
        var whereClause = "WHERE tenant_id = @TenantId AND is_deleted = false";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (!string.IsNullOrEmpty(request.VisitNumber))
        {
            whereClause += " AND visit_number = @VisitNumber";
            parameters.Add("VisitNumber", request.VisitNumber);
        }

        if (!string.IsNullOrEmpty(request.PatientUHID))
        {
            whereClause += " AND patient_uhid = @PatientUHID";
            parameters.Add("PatientUHID", request.PatientUHID);
        }

        if (request.PatientId.HasValue)
        {
            whereClause += " AND patient_id = @PatientId";
            parameters.Add("PatientId", request.PatientId);
        }

        if (request.DoctorId.HasValue)
        {
            whereClause += " AND doctor_id = @DoctorId";
            parameters.Add("DoctorId", request.DoctorId);
        }

        if (!string.IsNullOrEmpty(request.Department))
        {
            whereClause += " AND department = @Department";
            parameters.Add("Department", request.Department);
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
            whereClause += " AND DATE(visit_date_time) >= @FromDate";
            parameters.Add("FromDate", request.FromDate.Value.Date);
        }

        if (request.ToDate.HasValue)
        {
            whereClause += " AND DATE(visit_date_time) <= @ToDate";
            parameters.Add("ToDate", request.ToDate.Value.Date);
        }

        if (request.IsEmergency.HasValue)
        {
            whereClause += " AND is_emergency = @IsEmergency";
            parameters.Add("IsEmergency", request.IsEmergency.Value);
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $"{selectSql} {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        var countSql = $"SELECT COUNT(*) FROM visits {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Visit>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Visit>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<List<Visit>> GetPatientVisitHistoryAsync(Guid patientId, Guid tenantId, int limit = 10)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, visit_number as VisitNumber, patient_id as PatientId, 
                    patient_uhid as PatientUHID, appointment_id as AppointmentId, doctor_id as DoctorId, 
                    doctor_name as DoctorName, department as Department, visit_type as VisitType, 
                    priority as Priority, status as Status, visit_date_time as VisitDateTime, 
                    check_in_time as CheckInTime, check_out_time as CheckOutTime, chief_complaint as ChiefComplaint, 
                    symptoms as Symptoms, vital_signs as VitalSigns, diagnosis as Diagnosis, treatment as Treatment, 
                    prescription as Prescription, instructions as Instructions, follow_up_date as FollowUpDate, 
                    is_emergency as IsEmergency, is_ipd_converted as IsIPDConverted, ipd_admission_id as IPDAdmissionId, 
                    consultation_fee as ConsultationFee, payment_status as PaymentStatus, notes as Notes, 
                    created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
                    FROM visits 
            WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY visit_date_time DESC 
            LIMIT @Limit";
        
        var result = await connection.QueryAsync<Visit>(sql, new { PatientId = patientId, TenantId = tenantId, Limit = limit });
        return result.ToList();
    }

    public async Task<string> GenerateVisitNumberAsync(Guid tenantId, string tenantCode, string visitType)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            var date = DateTime.UtcNow;
            var prefix = visitType switch
            {
                "Emergency" => "EMR",
                "IPD" => "IPD",
                _ => "OPD"
            };
            
            var seqSql = @"
                INSERT INTO visit_sequences (id, tenant_id, tenant_code, visit_type, date, last_sequence, created_at, is_deleted)
                VALUES (uuid_generate_v4(), @TenantId, @TenantCode, @VisitType, @Date, 1, NOW(), false)
                ON CONFLICT (tenant_id, visit_type, date) 
                DO UPDATE SET 
                    last_sequence = visit_sequences.last_sequence + 1,
                    updated_at = NOW()
                RETURNING last_sequence";
            
            var sequence = await connection.ExecuteScalarAsync<int>(seqSql, new 
            { 
                TenantId = tenantId, 
                TenantCode = tenantCode, 
                VisitType = visitType,
                Date = date.Date
            }, transaction);
            
            transaction.Commit();
            
            return $"{prefix}-{tenantCode}-{date:yyyyMMdd}-{sequence:D4}";
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> CheckInAsync(Guid visitId, Guid tenantId, Guid userId)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE visits 
            SET check_in_time = @CheckInTime, status = 'InProgress', updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @VisitId AND tenant_id = @TenantId";
        
        var rows = await connection.ExecuteAsync(sql, new 
        { 
            VisitId = visitId, 
            TenantId = tenantId, 
            CheckInTime = DateTime.UtcNow, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = userId 
        });
        return rows > 0;
    }

    public async Task<bool> CheckOutAsync(Guid visitId, Guid tenantId, Guid userId)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE visits 
            SET check_out_time = @CheckOutTime, status = 'Completed', updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @VisitId AND tenant_id = @TenantId";
        
        var rows = await connection.ExecuteAsync(sql, new 
        { 
            VisitId = visitId, 
            TenantId = tenantId, 
            CheckOutTime = DateTime.UtcNow, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = userId 
        });
        return rows > 0;
    }

    public async Task<bool> ConvertToIPDAsync(Guid visitId, Guid ipdAdmissionId, Guid tenantId, Guid userId)
    {
        using var connection = CreateConnection();
        var sql = @"
            UPDATE visits 
            SET is_ipd_converted = true, ipd_admission_id = @IPDAdmissionId, 
                updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @VisitId AND tenant_id = @TenantId";
        
        var rows = await connection.ExecuteAsync(sql, new 
        { 
            VisitId = visitId, 
            IPDAdmissionId = ipdAdmissionId, 
            TenantId = tenantId, 
            UpdatedAt = DateTime.UtcNow, 
            UpdatedBy = userId 
        });
        return rows > 0;
    }

    public async Task<VisitStatsResponse> GetStatsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                COUNT(*) FILTER (WHERE is_deleted = false) as TotalVisits,
                COUNT(*) FILTER (WHERE DATE(visit_date_time) = CURRENT_DATE AND is_deleted = false) as TodayVisits,
                COUNT(*) FILTER (WHERE status IN ('Waiting', 'InProgress') AND is_deleted = false) as ActiveVisits,
                COUNT(*) FILTER (WHERE is_emergency = true AND is_deleted = false) as EmergencyVisits,
                COUNT(*) FILTER (WHERE is_ipd_converted = true AND is_deleted = false) as IPDConversions,
                COUNT(*) FILTER (WHERE status = 'Completed' AND is_deleted = false) as CompletedVisits
            FROM visits
            WHERE tenant_id = @TenantId";

        return await connection.QueryFirstOrDefaultAsync<VisitStatsResponse>(sql, new { TenantId = tenantId }) 
            ?? new VisitStatsResponse();
    }

    public async Task<List<Visit>> GetActiveVisitsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, visit_number as VisitNumber, patient_id as PatientId, 
                    patient_uhid as PatientUHID, appointment_id as AppointmentId, doctor_id as DoctorId, 
                    doctor_name as DoctorName, department as Department, visit_type as VisitType, 
                    priority as Priority, status as Status, visit_date_time as VisitDateTime, 
                    check_in_time as CheckInTime, check_out_time as CheckOutTime, chief_complaint as ChiefComplaint, 
                    symptoms as Symptoms, vital_signs as VitalSigns, diagnosis as Diagnosis, treatment as Treatment, 
                    prescription as Prescription, instructions as Instructions, follow_up_date as FollowUpDate, 
                    is_emergency as IsEmergency, is_ipd_converted as IsIPDConverted, ipd_admission_id as IPDAdmissionId, 
                    consultation_fee as ConsultationFee, payment_status as PaymentStatus, notes as Notes, 
                    created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
                    FROM visits 
            WHERE tenant_id = @TenantId AND status IN ('Waiting', 'InProgress') AND is_deleted = false
            ORDER BY 
                CASE WHEN priority = 'Emergency' THEN 1 
                     WHEN priority = 'Urgent' THEN 2 
                     ELSE 3 END,
                visit_date_time ASC";
        
        var result = await connection.QueryAsync<Visit>(sql, new { TenantId = tenantId });
        return result.ToList();
    }
}

public class VisitTimelineRepository : BaseRepository<VisitTimeline>, IVisitTimelineRepository
{
    protected override string TableName => "visit_timeline";

    public VisitTimelineRepository(string connectionString) : base(connectionString) { }

    public override async Task<Guid> CreateAsync(VisitTimeline timeline)
    {
        timeline.Id = Guid.NewGuid();
        timeline.EventDateTime = DateTime.UtcNow;
        timeline.CreatedAt = DateTime.UtcNow;
        timeline.IsDeleted = false;

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO visit_timeline (
                id, tenant_id, visit_id, event_type, event_description, event_date_time,
                performed_by, performed_by_name, event_data, created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @VisitId, @EventType, @EventDescription, @EventDateTime,
                @PerformedBy, @PerformedByName, @EventData::jsonb, @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, timeline);
        return timeline.Id;
    }

    public async Task<List<VisitTimeline>> GetByVisitIdAsync(Guid visitId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"
            SELECT * FROM visit_timeline 
            WHERE visit_id = @VisitId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY event_date_time ASC";
        
        var result = await connection.QueryAsync<VisitTimeline>(sql, new { VisitId = visitId, TenantId = tenantId });
        return result.ToList();
    }
}