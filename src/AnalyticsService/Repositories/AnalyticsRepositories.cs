using Dapper;
using AnalyticsService.Domain;
using Npgsql;
using Shared.Common.Helpers;
using Shared.Common.Interfaces;

namespace AnalyticsService.Repositories;

public interface IRevenueSummaryRepository : IBaseRepository<RevenueSummary>
{
    Task<List<RevenueSummary>> GetDailyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task<List<RevenueSummary>> GetMonthlyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task<List<RevenueSummary>> GetYearlyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task UpsertDailyRevenueAsync(DateTime date, decimal paidAmount, decimal refundAmount, int invoiceCount, int paymentCount, Guid tenantId, Guid userId);
}

public class RevenueSummaryRepository : BaseRepository<RevenueSummary>, IRevenueSummaryRepository
{
    public RevenueSummaryRepository(string connectionString) : base(connectionString, "analytics_revenue_summary") { }

    public async Task<List<RevenueSummary>> GetDailyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_revenue_summary 
                    WHERE tenant_id = @TenantId AND period = 'Daily' 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY date";
        var result = await connection.QueryAsync<RevenueSummary>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task<List<RevenueSummary>> GetMonthlyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_revenue_summary 
                    WHERE tenant_id = @TenantId AND period = 'Monthly' 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY date";
        var result = await connection.QueryAsync<RevenueSummary>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task<List<RevenueSummary>> GetYearlyRevenueAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_revenue_summary 
                    WHERE tenant_id = @TenantId AND period = 'Yearly' 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY date";
        var result = await connection.QueryAsync<RevenueSummary>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task UpsertDailyRevenueAsync(DateTime date, decimal paidAmount, decimal refundAmount, int invoiceCount, int paymentCount, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
            INSERT INTO analytics_revenue_summary (tenant_id, date, total_revenue, paid_amount, refund_amount, invoice_count, payment_count, period, created_by, created_at)
            VALUES (@TenantId, @Date, @TotalRevenue, @PaidAmount, @RefundAmount, @InvoiceCount, @PaymentCount, 'Daily', @UserId, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, date, period) 
            DO UPDATE SET 
                total_revenue = analytics_revenue_summary.total_revenue + @TotalRevenue,
                paid_amount = analytics_revenue_summary.paid_amount + @PaidAmount,
                refund_amount = analytics_revenue_summary.refund_amount + @RefundAmount,
                invoice_count = analytics_revenue_summary.invoice_count + @InvoiceCount,
                payment_count = analytics_revenue_summary.payment_count + @PaymentCount,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = @UserId";
        
        await connection.ExecuteAsync(sql, new 
        { 
            TenantId = tenantId, 
            Date = date.Date, 
            TotalRevenue = paidAmount - refundAmount,
            PaidAmount = paidAmount, 
            RefundAmount = refundAmount, 
            InvoiceCount = invoiceCount,
            PaymentCount = paymentCount,
            UserId = userId 
        });
    }
}

public interface IDoctorPerformanceRepository : IBaseRepository<DoctorPerformance>
{
    Task<List<DoctorPerformance>> GetPerformanceAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task UpsertPerformanceAsync(Guid doctorId, string doctorName, DateTime date, int encounterCount, int patientCount, decimal revenue, Guid tenantId, Guid userId);
}

public class DoctorPerformanceRepository : BaseRepository<DoctorPerformance>, IDoctorPerformanceRepository
{
    public DoctorPerformanceRepository(string connectionString) : base(connectionString, "analytics_doctor_performance") { }

    public async Task<List<DoctorPerformance>> GetPerformanceAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_doctor_performance 
                    WHERE tenant_id = @TenantId 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY total_revenue DESC";
        var result = await connection.QueryAsync<DoctorPerformance>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task UpsertPerformanceAsync(Guid doctorId, string doctorName, DateTime date, int encounterCount, int patientCount, decimal revenue, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
            INSERT INTO analytics_doctor_performance (tenant_id, doctor_id, doctor_name, date, encounter_count, patient_count, total_revenue, average_revenue_per_encounter, created_by, created_at)
            VALUES (@TenantId, @DoctorId, @DoctorName, @Date, @EncounterCount, @PatientCount, @TotalRevenue, @AvgRevenue, @UserId, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, doctor_id, date) 
            DO UPDATE SET 
                encounter_count = analytics_doctor_performance.encounter_count + @EncounterCount,
                patient_count = analytics_doctor_performance.patient_count + @PatientCount,
                total_revenue = analytics_doctor_performance.total_revenue + @TotalRevenue,
                average_revenue_per_encounter = (analytics_doctor_performance.total_revenue + @TotalRevenue) / NULLIF(analytics_doctor_performance.encounter_count + @EncounterCount, 0),
                updated_at = CURRENT_TIMESTAMP,
                updated_by = @UserId";
        
        var avgRevenue = encounterCount > 0 ? revenue / encounterCount : 0;
        await connection.ExecuteAsync(sql, new 
        { 
            TenantId = tenantId, 
            DoctorId = doctorId,
            DoctorName = doctorName,
            Date = date.Date, 
            EncounterCount = encounterCount,
            PatientCount = patientCount,
            TotalRevenue = revenue,
            AvgRevenue = avgRevenue,
            UserId = userId 
        });
    }
}

public interface IInsuranceSummaryRepository : IBaseRepository<InsuranceSummary>
{
    Task<List<InsuranceSummary>> GetSummaryAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task<List<InsuranceSummary>> GetApprovalRatesAsync(Guid tenantId);
    Task UpsertClaimAsync(Guid providerId, string providerName, DateTime date, decimal claimAmount, string status, decimal? approvedAmount, decimal? settledAmount, Guid tenantId, Guid userId);
}

public class InsuranceSummaryRepository : BaseRepository<InsuranceSummary>, IInsuranceSummaryRepository
{
    public InsuranceSummaryRepository(string connectionString) : base(connectionString, "analytics_insurance_summary") { }

    public async Task<List<InsuranceSummary>> GetSummaryAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_insurance_summary 
                    WHERE tenant_id = @TenantId 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY date DESC";
        var result = await connection.QueryAsync<InsuranceSummary>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task<List<InsuranceSummary>> GetApprovalRatesAsync(Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT provider_id, provider_name, 
                    SUM(total_claims) as total_claims,
                    SUM(approved_claims) as approved_claims,
                    CASE WHEN SUM(total_claims) > 0 THEN (SUM(approved_claims)::decimal / SUM(total_claims)) * 100 ELSE 0 END as approval_rate
                    FROM analytics_insurance_summary 
                    WHERE tenant_id = @TenantId AND is_deleted = false
                    GROUP BY provider_id, provider_name
                    ORDER BY approval_rate DESC";
        var result = await connection.QueryAsync<InsuranceSummary>(sql, new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task UpsertClaimAsync(Guid providerId, string providerName, DateTime date, decimal claimAmount, string status, decimal? approvedAmount, decimal? settledAmount, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
            INSERT INTO analytics_insurance_summary (tenant_id, provider_id, provider_name, date, total_claims, approved_claims, rejected_claims, settled_claims, total_claim_amount, approved_amount, settled_amount, approval_rate, created_by, created_at)
            VALUES (@TenantId, @ProviderId, @ProviderName, @Date, 1, @Approved, @Rejected, @Settled, @ClaimAmount, @ApprovedAmount, @SettledAmount, 0, @UserId, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, provider_id, date) 
            DO UPDATE SET 
                total_claims = analytics_insurance_summary.total_claims + 1,
                approved_claims = analytics_insurance_summary.approved_claims + @Approved,
                rejected_claims = analytics_insurance_summary.rejected_claims + @Rejected,
                settled_claims = analytics_insurance_summary.settled_claims + @Settled,
                total_claim_amount = analytics_insurance_summary.total_claim_amount + @ClaimAmount,
                approved_amount = analytics_insurance_summary.approved_amount + COALESCE(@ApprovedAmount, 0),
                settled_amount = analytics_insurance_summary.settled_amount + COALESCE(@SettledAmount, 0),
                approval_rate = CASE WHEN (analytics_insurance_summary.total_claims + 1) > 0 
                                THEN ((analytics_insurance_summary.approved_claims + @Approved)::decimal / (analytics_insurance_summary.total_claims + 1)) * 100 
                                ELSE 0 END,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = @UserId";
        
        var approved = status == "Approved" ? 1 : 0;
        var rejected = status == "Rejected" ? 1 : 0;
        var settled = status == "Settled" ? 1 : 0;
        
        await connection.ExecuteAsync(sql, new 
        { 
            TenantId = tenantId, 
            ProviderId = providerId,
            ProviderName = providerName,
            Date = date.Date,
            Approved = approved,
            Rejected = rejected,
            Settled = settled,
            ClaimAmount = claimAmount,
            ApprovedAmount = approvedAmount,
            SettledAmount = settledAmount,
            UserId = userId 
        });
    }
}

public interface IPatientSummaryRepository : IBaseRepository<PatientSummary>
{
    Task<List<PatientSummary>> GetSummaryAsync(DateTime fromDate, DateTime toDate, Guid tenantId);
    Task UpsertPatientMetricsAsync(DateTime date, int newPatients, int encounters, int appointments, decimal revenue, Guid tenantId, Guid userId);
}

public class PatientSummaryRepository : BaseRepository<PatientSummary>, IPatientSummaryRepository
{
    public PatientSummaryRepository(string connectionString) : base(connectionString, "analytics_patient_summary") { }

    public async Task<List<PatientSummary>> GetSummaryAsync(DateTime fromDate, DateTime toDate, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM analytics_patient_summary 
                    WHERE tenant_id = @TenantId 
                    AND date >= @FromDate AND date <= @ToDate 
                    AND is_deleted = false ORDER BY date";
        var result = await connection.QueryAsync<PatientSummary>(sql, new { TenantId = tenantId, FromDate = fromDate, ToDate = toDate });
        return result.ToList();
    }

    public async Task UpsertPatientMetricsAsync(DateTime date, int newPatients, int encounters, int appointments, decimal revenue, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"
            INSERT INTO analytics_patient_summary (tenant_id, date, new_patients, total_encounters, total_appointments, average_revenue_per_patient, created_by, created_at)
            VALUES (@TenantId, @Date, @NewPatients, @Encounters, @Appointments, @AvgRevenue, @UserId, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, date) 
            DO UPDATE SET 
                new_patients = analytics_patient_summary.new_patients + @NewPatients,
                total_encounters = analytics_patient_summary.total_encounters + @Encounters,
                total_appointments = analytics_patient_summary.total_appointments + @Appointments,
                average_revenue_per_patient = CASE WHEN (analytics_patient_summary.new_patients + @NewPatients) > 0 
                                               THEN @AvgRevenue 
                                               ELSE 0 END,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = @UserId";
        
        var avgRevenue = newPatients > 0 ? revenue / newPatients : 0;
        await connection.ExecuteAsync(sql, new 
        { 
            TenantId = tenantId, 
            Date = date.Date,
            NewPatients = newPatients,
            Encounters = encounters,
            Appointments = appointments,
            AvgRevenue = avgRevenue,
            UserId = userId 
        });
    }
}

public interface IEventOffsetRepository : IBaseRepository<EventOffset>
{
    Task<bool> IsEventProcessedAsync(string eventType, string eventId, Guid tenantId);
    Task RecordEventAsync(string eventType, string eventId, Guid tenantId, Guid userId);
}

public class EventOffsetRepository : BaseRepository<EventOffset>, IEventOffsetRepository
{
    public EventOffsetRepository(string connectionString) : base(connectionString, "analytics_event_offsets") { }

    public async Task<bool> IsEventProcessedAsync(string eventType, string eventId, Guid tenantId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = "SELECT COUNT(1) FROM analytics_event_offsets WHERE event_type = @EventType AND event_id = @EventId AND tenant_id = @TenantId";
        var count = await connection.ExecuteScalarAsync<int>(sql, new { EventType = eventType, EventId = eventId, TenantId = tenantId });
        return count > 0;
    }

    public async Task RecordEventAsync(string eventType, string eventId, Guid tenantId, Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO analytics_event_offsets (tenant_id, event_type, event_id, processed_at, created_by, created_at)
                    VALUES (@TenantId, @EventType, @EventId, CURRENT_TIMESTAMP, @UserId, CURRENT_TIMESTAMP)
                    ON CONFLICT (tenant_id, event_type, event_id) DO NOTHING";
        await connection.ExecuteAsync(sql, new { TenantId = tenantId, EventType = eventType, EventId = eventId, UserId = userId });
    }
}

