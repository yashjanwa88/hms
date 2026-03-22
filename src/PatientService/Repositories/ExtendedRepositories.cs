using Dapper;
using PatientService.Domain;
using PatientService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace PatientService.Repositories;

// ── Masters ───────────────────────────────────────────────────────────────────

public interface IMastersRepository
{
    // Prefixes
    Task<List<PatientPrefix>> GetPrefixesAsync(Guid tenantId);
    Task<Guid> CreatePrefixAsync(PatientPrefix prefix);
    Task<bool> UpdatePrefixAsync(PatientPrefix prefix);
    Task<bool> TogglePrefixAsync(Guid id, Guid tenantId);

    // Patient Types
    Task<List<PatientType>> GetPatientTypesAsync(Guid tenantId);
    Task<Guid> CreatePatientTypeAsync(PatientType type);
    Task<bool> UpdatePatientTypeAsync(PatientType type);
    Task<bool> TogglePatientTypeAsync(Guid id, Guid tenantId);

    // Registration Types
    Task<List<RegistrationType>> GetRegistrationTypesAsync(Guid tenantId);
    Task<Guid> CreateRegistrationTypeAsync(RegistrationType type);
    Task<bool> UpdateRegistrationTypeAsync(RegistrationType type);
    Task<bool> ToggleRegistrationTypeAsync(Guid id, Guid tenantId);
}

public class MastersRepository : BaseRepository<PatientPrefix>, IMastersRepository
{
    protected override string TableName => "patient_prefixes";

    public MastersRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientPrefix>> GetPrefixesAsync(Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, prefix_name as PrefixName,
            gender_applicable as GenderApplicable, is_active as IsActive, sort_order as SortOrder
            FROM patient_prefixes WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY sort_order, prefix_name";
        return (await conn.QueryAsync<PatientPrefix>(sql, new { TenantId = tenantId })).ToList();
    }

    public async Task<Guid> CreatePrefixAsync(PatientPrefix prefix)
    {
        prefix.Id = Guid.NewGuid();
        prefix.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        await conn.ExecuteAsync(@"INSERT INTO patient_prefixes (id, tenant_id, prefix_name, gender_applicable, is_active, sort_order, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @PrefixName, @GenderApplicable, @IsActive, @SortOrder, @CreatedAt, @CreatedBy, false)", prefix);
        return prefix.Id;
    }

    public async Task<bool> UpdatePrefixAsync(PatientPrefix prefix)
    {
        prefix.UpdatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(@"UPDATE patient_prefixes SET prefix_name=@PrefixName, gender_applicable=@GenderApplicable,
            sort_order=@SortOrder, updated_at=@UpdatedAt, updated_by=@UpdatedBy WHERE id=@Id AND tenant_id=@TenantId", prefix);
        return rows > 0;
    }

    public async Task<bool> TogglePrefixAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("UPDATE patient_prefixes SET is_active = NOT is_active WHERE id=@Id AND tenant_id=@TenantId", new { Id = id, TenantId = tenantId });
        return rows > 0;
    }

    public async Task<List<PatientType>> GetPatientTypesAsync(Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, type_name as TypeName, type_code as TypeCode,
            description as Description, discount_percent as DiscountPercent, is_active as IsActive, sort_order as SortOrder
            FROM patient_types WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY sort_order, type_name";
        return (await conn.QueryAsync<PatientType>(sql, new { TenantId = tenantId })).ToList();
    }

    public async Task<Guid> CreatePatientTypeAsync(PatientType type)
    {
        type.Id = Guid.NewGuid();
        type.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        await conn.ExecuteAsync(@"INSERT INTO patient_types (id, tenant_id, type_name, type_code, description, discount_percent, is_active, sort_order, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @TypeName, @TypeCode, @Description, @DiscountPercent, @IsActive, @SortOrder, @CreatedAt, @CreatedBy, false)", type);
        return type.Id;
    }

    public async Task<bool> UpdatePatientTypeAsync(PatientType type)
    {
        type.UpdatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(@"UPDATE patient_types SET type_name=@TypeName, type_code=@TypeCode, description=@Description,
            discount_percent=@DiscountPercent, sort_order=@SortOrder, updated_at=@UpdatedAt, updated_by=@UpdatedBy WHERE id=@Id AND tenant_id=@TenantId", type);
        return rows > 0;
    }

    public async Task<bool> TogglePatientTypeAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("UPDATE patient_types SET is_active = NOT is_active WHERE id=@Id AND tenant_id=@TenantId", new { Id = id, TenantId = tenantId });
        return rows > 0;
    }

    public async Task<List<RegistrationType>> GetRegistrationTypesAsync(Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, type_name as TypeName, type_code as TypeCode,
            description as Description, validity_days as ValidityDays, registration_fee as RegistrationFee,
            is_active as IsActive, sort_order as SortOrder
            FROM registration_types WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY sort_order, type_name";
        return (await conn.QueryAsync<RegistrationType>(sql, new { TenantId = tenantId })).ToList();
    }

    public async Task<Guid> CreateRegistrationTypeAsync(RegistrationType type)
    {
        type.Id = Guid.NewGuid();
        type.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        await conn.ExecuteAsync(@"INSERT INTO registration_types (id, tenant_id, type_name, type_code, description, validity_days, registration_fee, is_active, sort_order, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @TypeName, @TypeCode, @Description, @ValidityDays, @RegistrationFee, @IsActive, @SortOrder, @CreatedAt, @CreatedBy, false)", type);
        return type.Id;
    }

    public async Task<bool> UpdateRegistrationTypeAsync(RegistrationType type)
    {
        type.UpdatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(@"UPDATE registration_types SET type_name=@TypeName, type_code=@TypeCode, description=@Description,
            validity_days=@ValidityDays, registration_fee=@RegistrationFee, sort_order=@SortOrder,
            updated_at=@UpdatedAt, updated_by=@UpdatedBy WHERE id=@Id AND tenant_id=@TenantId", type);
        return rows > 0;
    }

    public async Task<bool> ToggleRegistrationTypeAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("UPDATE registration_types SET is_active = NOT is_active WHERE id=@Id AND tenant_id=@TenantId", new { Id = id, TenantId = tenantId });
        return rows > 0;
    }
}

// ── Queue ─────────────────────────────────────────────────────────────────────

public interface IQueueRepository
{
    Task<List<PatientQueue>> GetQueueAsync(Guid tenantId, DateTime date, Guid? doctorId, string? status);
    Task<QueueStatsResponse> GetStatsAsync(Guid tenantId, DateTime date);
    Task<string> GenerateTokenAsync(Guid tenantId, string departmentCode);
    Task<Guid> AddToQueueAsync(PatientQueue queue);
    Task<bool> UpdateStatusAsync(Guid id, Guid tenantId, string status, string? cancelReason, Guid updatedBy);
}

public class QueueRepository : BaseRepository<PatientQueue>, IQueueRepository
{
    protected override string TableName => "patient_queue";

    public QueueRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientQueue>> GetQueueAsync(Guid tenantId, DateTime date, Guid? doctorId, string? status)
    {
        using var conn = CreateConnection();
        var where = "WHERE pq.tenant_id = @TenantId AND pq.queue_date = @Date AND pq.is_deleted = false";
        var p = new DynamicParameters();
        p.Add("TenantId", tenantId);
        p.Add("Date", date.Date);

        if (doctorId.HasValue) { where += " AND pq.doctor_id = @DoctorId"; p.Add("DoctorId", doctorId); }
        if (!string.IsNullOrEmpty(status) && status != "All") { where += " AND pq.status = @Status"; p.Add("Status", status); }

        var sql = $@"SELECT pq.id as Id, pq.tenant_id as TenantId, pq.token_number as TokenNumber,
            pq.patient_id as PatientId, p.first_name || ' ' || p.last_name as PatientName,
            p.uhid as PatientUHID, p.mobile_number as MobileNumber,
            pq.department_name as DepartmentName, pq.doctor_name as DoctorName,
            pq.status as Status, pq.priority as Priority, pq.queue_date as QueueDate,
            pq.registration_time as RegistrationTime, pq.called_time as CalledTime,
            pq.completed_time as CompletedTime, pq.cancel_reason as CancelReason, pq.notes as Notes
            FROM patient_queue pq
            JOIN patients p ON p.id = pq.patient_id
            {where} ORDER BY pq.priority DESC, pq.registration_time ASC";

        return (await conn.QueryAsync<PatientQueue>(sql, p)).ToList();
    }

    public async Task<QueueStatsResponse> GetStatsAsync(Guid tenantId, DateTime date)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT
            COUNT(*) FILTER (WHERE status = 'Waiting') as WaitingCount,
            COUNT(*) FILTER (WHERE status = 'InProgress') as InProgressCount,
            COUNT(*) FILTER (WHERE status = 'Completed') as CompletedCount,
            COUNT(*) FILTER (WHERE status = 'Cancelled') as CancelledCount,
            COUNT(*) as TotalCount,
            COALESCE(AVG(EXTRACT(EPOCH FROM (called_time - registration_time))/60) FILTER (WHERE called_time IS NOT NULL), 0) as AvgWaitingMinutes
            FROM patient_queue WHERE tenant_id = @TenantId AND queue_date = @Date AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<QueueStatsResponse>(sql, new { TenantId = tenantId, Date = date.Date })
            ?? new QueueStatsResponse();
    }

    public async Task<string> GenerateTokenAsync(Guid tenantId, string departmentCode)
    {
        using var conn = CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();
        var sql = @"INSERT INTO queue_token_sequences (tenant_id, department_code, queue_date, last_sequence)
            VALUES (@TenantId, @DeptCode, CURRENT_DATE, 1)
            ON CONFLICT (tenant_id, department_code, queue_date)
            DO UPDATE SET last_sequence = queue_token_sequences.last_sequence + 1, updated_at = NOW()
            RETURNING last_sequence";
        var seq = await conn.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, DeptCode = departmentCode }, tx);
        tx.Commit();
        return $"{departmentCode}-{seq:D3}";
    }

    public async Task<Guid> AddToQueueAsync(PatientQueue queue)
    {
        queue.Id = Guid.NewGuid();
        queue.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        await conn.ExecuteAsync(@"INSERT INTO patient_queue (id, tenant_id, token_number, patient_id, department_name,
            doctor_id, doctor_name, status, priority, queue_date, registration_time, notes, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @TokenNumber, @PatientId, @DepartmentName, @DoctorId, @DoctorName,
            @Status, @Priority, @QueueDate, @RegistrationTime, @Notes, @CreatedAt, @CreatedBy, false)", queue);
        return queue.Id;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, Guid tenantId, string status, string? cancelReason, Guid updatedBy)
    {
        using var conn = CreateConnection();
        var sql = @"UPDATE patient_queue SET status = @Status,
            called_time = CASE WHEN @Status = 'InProgress' THEN NOW() ELSE called_time END,
            completed_time = CASE WHEN @Status = 'Completed' THEN NOW() ELSE completed_time END,
            cancelled_time = CASE WHEN @Status = 'Cancelled' THEN NOW() ELSE cancelled_time END,
            cancel_reason = @CancelReason, updated_at = NOW(), updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        var rows = await conn.ExecuteAsync(sql, new { Id = id, TenantId = tenantId, Status = status, CancelReason = cancelReason, UpdatedBy = updatedBy });
        return rows > 0;
    }
}

// ── Renewal ───────────────────────────────────────────────────────────────────

public interface IRenewalRepository
{
    Task<RenewalSearchResponse?> GetPatientRenewalInfoAsync(string searchTerm, Guid tenantId);
    Task<Guid> CreateRenewalAsync(PatientRenewal renewal);
    Task<List<PatientRenewal>> GetRenewalHistoryAsync(Guid patientId, Guid tenantId);
    Task<List<RenewalSearchResponse>> GetExpiringPatientsAsync(Guid tenantId, int daysAhead);
}

public class RenewalRepository : BaseRepository<PatientRenewal>, IRenewalRepository
{
    protected override string TableName => "patient_renewals";

    public RenewalRepository(string connectionString) : base(connectionString) { }

    public async Task<RenewalSearchResponse?> GetPatientRenewalInfoAsync(string searchTerm, Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT p.id as PatientId, p.first_name || ' ' || p.last_name as PatientName,
            p.uhid as UHID, p.mobile_number as MobileNumber, p.registration_date as RegistrationDate,
            p.valid_till as ValidTill, rt.type_name as RegistrationType, pt.type_name as PatientType,
            COALESCE(EXTRACT(DAY FROM p.valid_till - CURRENT_DATE)::INT, -1) as DaysRemaining,
            p.valid_till < CURRENT_DATE as IsExpired,
            COALESCE(rt.registration_fee, 0) as RenewalFee,
            (SELECT MAX(renewed_at) FROM patient_renewals WHERE patient_id = p.id AND is_deleted = false) as LastRenewalDate,
            (SELECT COUNT(*) FROM patient_renewals WHERE patient_id = p.id AND is_deleted = false)::INT as RenewalCount
            FROM patients p
            LEFT JOIN registration_types rt ON rt.id = p.registration_type_id
            LEFT JOIN patient_types pt ON pt.id = p.patient_type_id
            WHERE p.tenant_id = @TenantId AND p.is_deleted = false
            AND (p.uhid = @Term OR p.mobile_number = @Term)
            LIMIT 1";
        return await conn.QueryFirstOrDefaultAsync<RenewalSearchResponse>(sql, new { TenantId = tenantId, Term = searchTerm });
    }

    public async Task<Guid> CreateRenewalAsync(PatientRenewal renewal)
    {
        renewal.Id = Guid.NewGuid();
        renewal.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        // Generate renewal number
        var year = DateTime.UtcNow.Year;
        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM patient_renewals WHERE tenant_id = @TenantId AND EXTRACT(YEAR FROM created_at) = @Year",
            new { TenantId = renewal.TenantId, Year = year }, tx);
        renewal.RenewalNumber = $"RNW-{year}-{(count + 1):D5}";

        await conn.ExecuteAsync(@"INSERT INTO patient_renewals (id, tenant_id, patient_id, renewal_number,
            previous_valid_till, new_valid_till, renewal_period_days, renewal_fee, discount, final_amount,
            payment_mode, payment_reference, renewed_by, renewed_at, notes, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @PatientId, @RenewalNumber, @PreviousValidTill, @NewValidTill,
            @RenewalPeriodDays, @RenewalFee, @Discount, @FinalAmount, @PaymentMode, @PaymentReference,
            @RenewedBy, @RenewedAt, @Notes, @CreatedAt, @CreatedBy, false)", renewal, tx);

        // Update patient valid_till
        await conn.ExecuteAsync("UPDATE patients SET valid_till = @NewValidTill, updated_at = NOW(), updated_by = @RenewedBy WHERE id = @PatientId",
            new { renewal.NewValidTill, renewal.RenewedBy, renewal.PatientId }, tx);

        tx.Commit();
        return renewal.Id;
    }

    public async Task<List<PatientRenewal>> GetRenewalHistoryAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT id as Id, tenant_id as TenantId, patient_id as PatientId, renewal_number as RenewalNumber,
            previous_valid_till as PreviousValidTill, new_valid_till as NewValidTill,
            renewal_period_days as RenewalPeriodDays, renewal_fee as RenewalFee, discount as Discount,
            final_amount as FinalAmount, payment_mode as PaymentMode, renewed_by as RenewedBy, renewed_at as RenewedAt
            FROM patient_renewals WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY renewed_at DESC";
        return (await conn.QueryAsync<PatientRenewal>(sql, new { PatientId = patientId, TenantId = tenantId })).ToList();
    }

    public async Task<List<RenewalSearchResponse>> GetExpiringPatientsAsync(Guid tenantId, int daysAhead)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT p.id as PatientId, p.first_name || ' ' || p.last_name as PatientName,
            p.uhid as UHID, p.mobile_number as MobileNumber, p.valid_till as ValidTill,
            EXTRACT(DAY FROM p.valid_till - CURRENT_DATE)::INT as DaysRemaining,
            p.valid_till < CURRENT_DATE as IsExpired
            FROM patients p
            WHERE p.tenant_id = @TenantId AND p.is_deleted = false
            AND p.valid_till IS NOT NULL
            AND p.valid_till <= CURRENT_DATE + INTERVAL '1 day' * @DaysAhead
            ORDER BY p.valid_till ASC LIMIT 100";
        return (await conn.QueryAsync<RenewalSearchResponse>(sql, new { TenantId = tenantId, DaysAhead = daysAhead })).ToList();
    }
}

// ── Card Reprint ──────────────────────────────────────────────────────────────

public interface ICardReprintRepository
{
    Task<CardReprintSearchResponse?> GetPatientReprintInfoAsync(string searchTerm, Guid tenantId);
    Task<Guid> CreateReprintAsync(PatientCardReprint reprint);
    Task<List<PatientCardReprint>> GetReprintHistoryAsync(Guid patientId, Guid tenantId);
}

public class CardReprintRepository : BaseRepository<PatientCardReprint>, ICardReprintRepository
{
    protected override string TableName => "patient_card_reprints";

    public CardReprintRepository(string connectionString) : base(connectionString) { }

    public async Task<CardReprintSearchResponse?> GetPatientReprintInfoAsync(string searchTerm, Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT p.id as PatientId, p.first_name || ' ' || p.last_name as PatientName,
            p.uhid as UHID, p.mobile_number as MobileNumber, p.registration_date as RegistrationDate,
            COALESCE(p.reprint_count, 0) as ReprintCount, p.last_reprint_date as LastReprintDate
            FROM patients p
            WHERE p.tenant_id = @TenantId AND p.is_deleted = false
            AND (p.uhid = @Term OR p.mobile_number = @Term) LIMIT 1";
        var patient = await conn.QueryFirstOrDefaultAsync<CardReprintSearchResponse>(sql, new { TenantId = tenantId, Term = searchTerm });
        if (patient == null) return null;

        patient.ReprintHistory = await GetReprintHistoryResponseAsync(patient.PatientId, tenantId, conn);
        return patient;
    }

    private async Task<List<CardReprintResponse>> GetReprintHistoryResponseAsync(Guid patientId, Guid tenantId, System.Data.IDbConnection conn)
    {
        var sql = @"SELECT id as Id, reprint_number as ReprintNumber, reason as Reason, charges as Charges,
            payment_mode as PaymentMode, reprinted_by_name as ReprintedByName, reprinted_at as ReprintedAt
            FROM patient_card_reprints WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY reprinted_at DESC";
        return (await conn.QueryAsync<CardReprintResponse>(sql, new { PatientId = patientId, TenantId = tenantId })).ToList();
    }

    public async Task<Guid> CreateReprintAsync(PatientCardReprint reprint)
    {
        reprint.Id = Guid.NewGuid();
        reprint.CreatedAt = DateTime.UtcNow;
        using var conn = CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        var reprintCount = await conn.ExecuteScalarAsync<int>(
            "SELECT COALESCE(reprint_count, 0) FROM patients WHERE id = @Id", new { Id = reprint.PatientId }, tx);
        reprint.ReprintNumber = reprintCount + 1;

        await conn.ExecuteAsync(@"INSERT INTO patient_card_reprints (id, tenant_id, patient_id, reprint_number, reason,
            charges, payment_mode, payment_reference, reprinted_by, reprinted_by_name, reprinted_at, notes, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @PatientId, @ReprintNumber, @Reason, @Charges, @PaymentMode, @PaymentReference,
            @ReprintedBy, @ReprintedByName, @ReprintedAt, @Notes, @CreatedAt, @CreatedBy, false)", reprint, tx);

        await conn.ExecuteAsync(@"UPDATE patients SET reprint_count = COALESCE(reprint_count, 0) + 1,
            last_reprint_date = NOW(), updated_at = NOW(), updated_by = @ReprintedBy WHERE id = @PatientId",
            new { reprint.ReprintedBy, reprint.PatientId }, tx);

        tx.Commit();
        return reprint.Id;
    }

    public async Task<List<PatientCardReprint>> GetReprintHistoryAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        var sql = @"SELECT id as Id, reprint_number as ReprintNumber, reason as Reason, charges as Charges,
            payment_mode as PaymentMode, reprinted_by_name as ReprintedByName, reprinted_at as ReprintedAt
            FROM patient_card_reprints WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false
            ORDER BY reprinted_at DESC";
        return (await conn.QueryAsync<PatientCardReprint>(sql, new { PatientId = patientId, TenantId = tenantId })).ToList();
    }
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

public interface IAuditLogRepository
{
    Task LogAsync(PatientAuditLog log);
    Task<PagedResult<PatientAuditLog>> GetLogsAsync(AuditLogFilterRequest filter, Guid tenantId);
}

public class AuditLogRepository : IAuditLogRepository
{
    private readonly string _connectionString;
    public AuditLogRepository(string connectionString) => _connectionString = connectionString;

    private System.Data.IDbConnection CreateConnection() => new Npgsql.NpgsqlConnection(_connectionString);

    public async Task LogAsync(PatientAuditLog log)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(@"INSERT INTO patient_audit_logs (id, tenant_id, patient_id, patient_uhid, action,
            entity_name, field_changed, old_value, new_value, description, changed_by, changed_by_name,
            changed_by_role, ip_address, user_agent, changed_at)
            VALUES (@Id, @TenantId, @PatientId, @PatientUHID, @Action, @EntityName, @FieldChanged,
            @OldValue, @NewValue, @Description, @ChangedBy, @ChangedByName, @ChangedByRole,
            @IpAddress, @UserAgent, @ChangedAt)", log);
    }

    public async Task<PagedResult<PatientAuditLog>> GetLogsAsync(AuditLogFilterRequest filter, Guid tenantId)
    {
        using var conn = CreateConnection();
        var where = "WHERE tenant_id = @TenantId";
        var p = new DynamicParameters();
        p.Add("TenantId", tenantId);

        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            where += " AND (patient_uhid ILIKE @Search OR changed_by_name ILIKE @Search)";
            p.Add("Search", $"%{filter.SearchTerm}%");
        }
        if (!string.IsNullOrEmpty(filter.Action) && filter.Action != "All")
        {
            where += " AND action = @Action";
            p.Add("Action", filter.Action);
        }
        if (filter.PatientId.HasValue) { where += " AND patient_id = @PatientId"; p.Add("PatientId", filter.PatientId); }
        if (filter.DateFrom.HasValue) { where += " AND changed_at >= @DateFrom"; p.Add("DateFrom", filter.DateFrom); }
        if (filter.DateTo.HasValue) { where += " AND changed_at <= @DateTo"; p.Add("DateTo", filter.DateTo.Value.AddDays(1)); }

        var offset = (filter.PageNumber - 1) * filter.PageSize;
        p.Add("PageSize", filter.PageSize);
        p.Add("Offset", offset);

        var sql = $@"SELECT id as Id, tenant_id as TenantId, patient_id as PatientId, patient_uhid as PatientUHID,
            action as Action, field_changed as FieldChanged, old_value as OldValue, new_value as NewValue,
            description as Description, changed_by as ChangedBy, changed_by_name as ChangedByName,
            changed_by_role as ChangedByRole, ip_address as IpAddress, changed_at as ChangedAt
            FROM patient_audit_logs {where} ORDER BY changed_at DESC LIMIT @PageSize OFFSET @Offset";
        var countSql = $"SELECT COUNT(*) FROM patient_audit_logs {where}";

        var items = await conn.QueryAsync<PatientAuditLog>(sql, p);
        var total = await conn.ExecuteScalarAsync<int>(countSql, p);

        return new PagedResult<PatientAuditLog>
        {
            Items = items.ToList(),
            TotalCount = total,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }
}
