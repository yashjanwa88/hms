using AppointmentService.Domain;
using AppointmentService.DTOs;
using Dapper;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace AppointmentService.Repositories;

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(Appointment appointment);
    Task<bool> UpdateAsync(Appointment appointment);
    Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy);
    Task<PagedResult<Appointment>> SearchAsync(AppointmentSearchRequest request, Guid tenantId);
    Task<string> GenerateAppointmentNumberAsync(Guid tenantId, string tenantCode);
    Task<bool> HasConflictingAppointmentAsync(Guid doctorId, DateTime date, TimeSpan startTime, TimeSpan endTime, Guid tenantId, Guid? excludeAppointmentId = null);
    Task<List<Appointment>> GetDoctorAppointmentsForDateAsync(Guid doctorId, DateTime date, Guid tenantId);
    Task<int> GetDoctorAppointmentCountForDateAsync(Guid doctorId, DateTime date, Guid tenantId);
}

public class AppointmentRepository : BaseRepository<Appointment>, IAppointmentRepository
{
    protected override string TableName => "appointments";

    public AppointmentRepository(string connectionString) : base(connectionString) { }

    public override async Task<Appointment?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, appointment_number as AppointmentNumber,
            patient_id as PatientId, doctor_id as DoctorId, appointment_date as AppointmentDate,
            start_time as StartTime, end_time as EndTime, status as Status,
            appointment_type as AppointmentType, reason as Reason, notes as Notes,
            check_in_time as CheckInTime, completed_time as CompletedTime,
            cancellation_reason as CancellationReason, cancelled_by as CancelledBy,
            cancelled_at as CancelledAt, created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM appointments WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Appointment>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<PagedResult<Appointment>> SearchAsync(AppointmentSearchRequest request, Guid tenantId)
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

        if (request.AppointmentDate.HasValue)
        {
            whereClause += " AND appointment_date = @AppointmentDate";
            parameters.Add("AppointmentDate", request.AppointmentDate.Value.Date);
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            whereClause += " AND status = @Status";
            parameters.Add("Status", request.Status);
        }

        if (request.FromDate.HasValue)
        {
            whereClause += " AND appointment_date >= @FromDate";
            parameters.Add("FromDate", request.FromDate.Value.Date);
        }

        if (request.ToDate.HasValue)
        {
            whereClause += " AND appointment_date <= @ToDate";
            parameters.Add("ToDate", request.ToDate.Value.Date);
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $@"SELECT 
            id as Id, tenant_id as TenantId, appointment_number as AppointmentNumber,
            patient_id as PatientId, doctor_id as DoctorId, appointment_date as AppointmentDate,
            start_time as StartTime, end_time as EndTime, status as Status,
            appointment_type as AppointmentType, reason as Reason, notes as Notes,
            check_in_time as CheckInTime, completed_time as CompletedTime,
            cancellation_reason as CancellationReason, cancelled_by as CancelledBy,
            cancelled_at as CancelledAt, created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM appointments {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        var countSql = $"SELECT COUNT(*) FROM appointments {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Appointment>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Appointment>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<string> GenerateAppointmentNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = CreateConnection();
        
        var year = DateTime.UtcNow.Year;
        var sql = @"
            SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_number FROM POSITION('-' IN SUBSTRING(appointment_number FROM 11)) + 11) AS INTEGER)), 0) + 1
            FROM appointments 
            WHERE tenant_id = @TenantId 
            AND appointment_number LIKE @Pattern";

        var pattern = $"APPT-{tenantCode}-{year}-%";
        var nextNumber = await connection.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Pattern = pattern });

        return $"APPT-{tenantCode}-{year}-{nextNumber:D6}";
    }

    public async Task<bool> HasConflictingAppointmentAsync(Guid doctorId, DateTime date, TimeSpan startTime, TimeSpan endTime, Guid tenantId, Guid? excludeAppointmentId = null)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND appointment_date = @Date
            AND status NOT IN ('Cancelled', 'Completed')
            AND is_deleted = false
            AND (
                (start_time <= @StartTime AND end_time > @StartTime)
                OR (start_time < @EndTime AND end_time >= @EndTime)
                OR (start_time >= @StartTime AND end_time <= @EndTime)
            )";

        if (excludeAppointmentId.HasValue)
        {
            sql += " AND id != @ExcludeId";
        }

        var count = await connection.ExecuteScalarAsync<int>(sql, new 
        { 
            DoctorId = doctorId, 
            TenantId = tenantId, 
            Date = date.Date,
            StartTime = startTime, 
            EndTime = endTime,
            ExcludeId = excludeAppointmentId
        });
        
        return count > 0;
    }

    public async Task<List<Appointment>> GetDoctorAppointmentsForDateAsync(Guid doctorId, DateTime date, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT * FROM appointments 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND appointment_date = @Date
            AND status NOT IN ('Cancelled')
            AND is_deleted = false
            ORDER BY start_time";

        var result = await connection.QueryAsync<Appointment>(sql, new { DoctorId = doctorId, TenantId = tenantId, Date = date.Date });
        return result.ToList();
    }

    public async Task<int> GetDoctorAppointmentCountForDateAsync(Guid doctorId, DateTime date, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND appointment_date = @Date
            AND status NOT IN ('Cancelled')
            AND is_deleted = false";

        return await connection.ExecuteScalarAsync<int>(sql, new { DoctorId = doctorId, TenantId = tenantId, Date = date.Date });
    }
}

public interface IAppointmentStatusHistoryRepository
{
    Task<Guid> CreateAsync(AppointmentStatusHistory history);
    Task<List<AppointmentStatusHistory>> GetByAppointmentIdAsync(Guid appointmentId, Guid tenantId);
}

public class AppointmentStatusHistoryRepository : BaseRepository<AppointmentStatusHistory>, IAppointmentStatusHistoryRepository
{
    protected override string TableName => "appointment_status_history";

    public AppointmentStatusHistoryRepository(string connectionString) : base(connectionString) { }

    public async Task<List<AppointmentStatusHistory>> GetByAppointmentIdAsync(Guid appointmentId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM appointment_status_history WHERE appointment_id = @AppointmentId AND tenant_id = @TenantId ORDER BY changed_at DESC";
        var result = await connection.QueryAsync<AppointmentStatusHistory>(sql, new { AppointmentId = appointmentId, TenantId = tenantId });
        return result.ToList();
    }
}

public interface IAppointmentSlotLockRepository
{
    Task<Guid> CreateAsync(AppointmentSlotLock slotLock);
    Task<bool> IsSlotLockedAsync(Guid doctorId, DateTime date, TimeSpan startTime, TimeSpan endTime, Guid tenantId);
    Task CleanupExpiredLocksAsync();
}

public class AppointmentSlotLockRepository : BaseRepository<AppointmentSlotLock>, IAppointmentSlotLockRepository
{
    protected override string TableName => "appointment_slot_lock";

    public AppointmentSlotLockRepository(string connectionString) : base(connectionString) { }

    public async Task<bool> IsSlotLockedAsync(Guid doctorId, DateTime date, TimeSpan startTime, TimeSpan endTime, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT COUNT(*) FROM appointment_slot_lock 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND appointment_date = @Date
            AND expires_at > @Now
            AND (
                (start_time <= @StartTime AND end_time > @StartTime)
                OR (start_time < @EndTime AND end_time >= @EndTime)
                OR (start_time >= @StartTime AND end_time <= @EndTime)
            )";

        var count = await connection.ExecuteScalarAsync<int>(sql, new 
        { 
            DoctorId = doctorId, 
            TenantId = tenantId, 
            Date = date.Date,
            Now = DateTime.UtcNow,
            StartTime = startTime, 
            EndTime = endTime
        });
        
        return count > 0;
    }

    public async Task CleanupExpiredLocksAsync()
    {
        using var connection = CreateConnection();
        var sql = "DELETE FROM appointment_slot_lock WHERE expires_at <= @Now";
        await connection.ExecuteAsync(sql, new { Now = DateTime.UtcNow });
    }
}
