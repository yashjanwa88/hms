using Dapper;
using Npgsql;
using AppointmentService.Domain;

namespace AppointmentService.Repositories;

public interface IQueueRepository
{
    Task<string> GenerateTokenNumberAsync(Guid tenantId, string prefix = "T");
    Task<QueueToken> CreateTokenAsync(QueueToken token);
    Task<QueueToken?> GetTokenByIdAsync(Guid tokenId, Guid tenantId);
    Task<List<ActiveQueueItem>> GetActiveQueueAsync(Guid tenantId, Guid? doctorId = null);
    Task<QueueToken?> GetNextWaitingTokenAsync(Guid tenantId, Guid doctorId);
    Task<bool> UpdateTokenStatusAsync(Guid tokenId, string status, Guid tenantId);
    Task<bool> CallTokenAsync(Guid tokenId, Guid tenantId);
    Task<bool> CompleteTokenAsync(Guid tokenId, Guid tenantId);
    Task<List<QueueToken>> GetTodayTokensAsync(Guid tenantId, Guid? doctorId = null);
    Task<QueueStatistics?> GetDailyStatisticsAsync(Guid tenantId, DateTime date, Guid? doctorId = null);
    Task<int> GetQueuePositionAsync(Guid tokenId);
}

public class QueueRepository : IQueueRepository
{
    private readonly string _connectionString;

    public QueueRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    private NpgsqlConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<string> GenerateTokenNumberAsync(Guid tenantId, string prefix = "T")
    {
        using var conn = CreateConnection();
        
        var sql = "SELECT get_next_token_number(@TenantId, @Prefix)";
        
        var tokenNumber = await conn.ExecuteScalarAsync<string>(sql, new { TenantId = tenantId, Prefix = prefix });
        return tokenNumber ?? "T001";
    }

    public async Task<QueueToken> CreateTokenAsync(QueueToken token)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            INSERT INTO queue_tokens (
                id, tenant_id, token_number, token_prefix, sequence_number,
                patient_id, patient_name, appointment_id, doctor_id, doctor_name,
                queue_date, status, assigned_at, priority, notes,
                created_at, created_by, is_deleted
            )
            VALUES (
                @Id, @TenantId, @TokenNumber, @TokenPrefix, @SequenceNumber,
                @PatientId, @PatientName, @AppointmentId, @DoctorId, @DoctorName,
                @QueueDate, @Status, @AssignedAt, @Priority, @Notes,
                @CreatedAt, @CreatedBy, false
            )
            RETURNING 
                id as Id, tenant_id as TenantId, token_number as TokenNumber,
                patient_name as PatientName, doctor_name as DoctorName,
                status as Status, assigned_at as AssignedAt";

        return await conn.QuerySingleAsync<QueueToken>(sql, token);
    }

    public async Task<QueueToken?> GetTokenByIdAsync(Guid tokenId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                token_number as TokenNumber,
                token_prefix as TokenPrefix,
                sequence_number as SequenceNumber,
                patient_id as PatientId,
                patient_name as PatientName,
                appointment_id as AppointmentId,
                doctor_id as DoctorId,
                doctor_name as DoctorName,
                queue_date as QueueDate,
                status as Status,
                assigned_at as AssignedAt,
                called_at as CalledAt,
                started_at as StartedAt,
                completed_at as CompletedAt,
                priority as Priority,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy
            FROM queue_tokens
            WHERE id = @TokenId AND tenant_id = @TenantId AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<QueueToken>(sql, new { TokenId = tokenId, TenantId = tenantId });
    }

    public async Task<List<ActiveQueueItem>> GetActiveQueueAsync(Guid tenantId, Guid? doctorId = null)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                token_number as TokenNumber,
                patient_name as PatientName,
                doctor_name as DoctorName,
                status as Status,
                priority as Priority,
                assigned_at as AssignedAt,
                called_at as CalledAt,
                EXTRACT(EPOCH FROM (NOW() - assigned_at)) / 60 as WaitTimeMinutes,
                get_queue_position(id) as QueuePosition
            FROM queue_tokens
            WHERE tenant_id = @TenantId
              AND queue_date = CURRENT_DATE
              AND status IN ('Waiting', 'Called', 'InProgress')
              AND is_deleted = false
              AND (@DoctorId IS NULL OR doctor_id = @DoctorId)
            ORDER BY priority DESC, assigned_at ASC";

        var items = await conn.QueryAsync<ActiveQueueItem>(sql, new { TenantId = tenantId, DoctorId = doctorId });
        return items.ToList();
    }

    public async Task<QueueToken?> GetNextWaitingTokenAsync(Guid tenantId, Guid doctorId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                token_number as TokenNumber,
                patient_id as PatientId,
                patient_name as PatientName,
                doctor_id as DoctorId,
                doctor_name as DoctorName,
                status as Status,
                priority as Priority,
                assigned_at as AssignedAt
            FROM queue_tokens
            WHERE tenant_id = @TenantId
              AND doctor_id = @DoctorId
              AND queue_date = CURRENT_DATE
              AND status = 'Waiting'
              AND is_deleted = false
            ORDER BY priority DESC, assigned_at ASC
            LIMIT 1";

        return await conn.QueryFirstOrDefaultAsync<QueueToken>(sql, new { TenantId = tenantId, DoctorId = doctorId });
    }

    public async Task<bool> UpdateTokenStatusAsync(Guid tokenId, string status, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            UPDATE queue_tokens
            SET status = @Status,
                updated_at = NOW()
            WHERE id = @TokenId AND tenant_id = @TenantId AND is_deleted = false";

        var rowsAffected = await conn.ExecuteAsync(sql, new { TokenId = tokenId, Status = status, TenantId = tenantId });
        return rowsAffected > 0;
    }

    public async Task<bool> CallTokenAsync(Guid tokenId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            UPDATE queue_tokens
            SET status = 'Called',
                called_at = NOW(),
                updated_at = NOW()
            WHERE id = @TokenId AND tenant_id = @TenantId AND status = 'Waiting' AND is_deleted = false";

        var rowsAffected = await conn.ExecuteAsync(sql, new { TokenId = tokenId, TenantId = tenantId });
        return rowsAffected > 0;
    }

    public async Task<bool> CompleteTokenAsync(Guid tokenId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            UPDATE queue_tokens
            SET status = 'Completed',
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = @TokenId AND tenant_id = @TenantId AND is_deleted = false";

        var rowsAffected = await conn.ExecuteAsync(sql, new { TokenId = tokenId, TenantId = tenantId });
        return rowsAffected > 0;
    }

    public async Task<List<QueueToken>> GetTodayTokensAsync(Guid tenantId, Guid? doctorId = null)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                token_number as TokenNumber,
                patient_name as PatientName,
                doctor_name as DoctorName,
                status as Status,
                priority as Priority,
                assigned_at as AssignedAt,
                called_at as CalledAt,
                completed_at as CompletedAt
            FROM queue_tokens
            WHERE tenant_id = @TenantId
              AND queue_date = CURRENT_DATE
              AND is_deleted = false
              AND (@DoctorId IS NULL OR doctor_id = @DoctorId)
            ORDER BY assigned_at DESC";

        var tokens = await conn.QueryAsync<QueueToken>(sql, new { TenantId = tenantId, DoctorId = doctorId });
        return tokens.ToList();
    }

    public async Task<QueueStatistics?> GetDailyStatisticsAsync(Guid tenantId, DateTime date, Guid? doctorId = null)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                @TenantId as TenantId,
                @Date as QueueDate,
                @DoctorId as DoctorId,
                COUNT(*) as TotalTokens,
                COUNT(*) FILTER (WHERE status = 'Completed') as CompletedTokens,
                COUNT(*) FILTER (WHERE status = 'Cancelled') as CancelledTokens,
                COUNT(*) FILTER (WHERE status IN ('Waiting', 'Called')) as WaitingTokens,
                CAST(AVG(EXTRACT(EPOCH FROM (called_at - assigned_at)) / 60) FILTER (WHERE called_at IS NOT NULL) AS INT) as AvgWaitTimeMinutes,
                CAST(MIN(EXTRACT(EPOCH FROM (called_at - assigned_at)) / 60) FILTER (WHERE called_at IS NOT NULL) AS INT) as MinWaitTimeMinutes,
                CAST(MAX(EXTRACT(EPOCH FROM (called_at - assigned_at)) / 60) FILTER (WHERE called_at IS NOT NULL) AS INT) as MaxWaitTimeMinutes,
                CAST(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) AS INT) as AvgServiceTimeMinutes,
                NOW() as UpdatedAt
            FROM queue_tokens
            WHERE tenant_id = @TenantId
              AND queue_date = @Date
              AND is_deleted = false
              AND (@DoctorId IS NULL OR doctor_id = @DoctorId)";

        return await conn.QueryFirstOrDefaultAsync<QueueStatistics>(sql, new { TenantId = tenantId, Date = date.Date, DoctorId = doctorId });
    }

    public async Task<int> GetQueuePositionAsync(Guid tokenId)
    {
        using var conn = CreateConnection();
        
        var sql = "SELECT get_queue_position(@TokenId)";
        
        return await conn.ExecuteScalarAsync<int>(sql, new { TokenId = tokenId });
    }
}
