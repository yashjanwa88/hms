using Dapper;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using PatientService.Domain;
using PatientService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;
using System.Diagnostics;
using System.Text.Json;

namespace PatientService.Repositories;

public class OptimizedPatientRepository : BaseRepository<Patient>, IPatientRepository
{
    protected override string TableName => "patients";
    private readonly IDistributedCache _cache;
    private readonly ILogger<OptimizedPatientRepository> _logger;
    private const int CacheExpirationMinutes = 15;

    public OptimizedPatientRepository(string connectionString, IDistributedCache cache, ILogger<OptimizedPatientRepository> logger) 
        : base(connectionString) 
    {
        _cache = cache;
        _logger = logger;
    }

    public override async Task<Patient?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var cacheKey = $"patient:{tenantId}:{id}";
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            // Try cache first
            var cachedPatient = await _cache.GetStringAsync(cacheKey);
            if (cachedPatient != null)
            {
                _logger.LogDebug("Cache hit for patient {PatientId}", id);
                return JsonSerializer.Deserialize<Patient>(cachedPatient);
            }

            // Database query with covering index
            using var connection = CreateConnection();
            var sql = @"
                SELECT id, tenant_id, uhid, first_name, middle_name, last_name, gender, date_of_birth,
                       blood_group, marital_status, mobile_number, alternate_mobile, email, whatsapp_number,
                       address_line1, address_line2, city, state, pincode, country, status, visit_count,
                       registration_date, created_at, updated_at, is_deleted
                FROM patients 
                WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
            
            var patient = await connection.QueryFirstOrDefaultAsync<Patient>(sql, new { Id = id, TenantId = tenantId });
            
            if (patient != null)
            {
                // Cache for 15 minutes
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
                };
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(patient), cacheOptions);
            }

            return patient;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("GetById", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public async Task<Patient?> GetByUHIDAsync(string uhid, Guid tenantId)
    {
        var cacheKey = $"patient:uhid:{tenantId}:{uhid}";
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var cachedPatient = await _cache.GetStringAsync(cacheKey);
            if (cachedPatient != null)
            {
                return JsonSerializer.Deserialize<Patient>(cachedPatient);
            }

            using var connection = CreateConnection();
            // Use hash index for UHID lookup
            var sql = @"
                SELECT * FROM patients 
                WHERE uhid = @UHID AND tenant_id = @TenantId AND is_deleted = false";
            
            var patient = await connection.QueryFirstOrDefaultAsync<Patient>(sql, new { UHID = uhid, TenantId = tenantId });
            
            if (patient != null)
            {
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
                };
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(patient), cacheOptions);
            }

            return patient;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("GetByUHID", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public async Task<PagedResult<Patient>> SearchAsync(PatientSearchRequest request, Guid tenantId)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            using var connection = CreateConnection();
            
            // Use optimized search function
            var sql = @"
                SELECT * FROM search_patients_optimized(
                    @TenantId, @SearchTerm, @UHID, @MobileNumber, @Status, @Gender, @City, @PageSize, @Offset
                )";
            
            var countSql = @"
                SELECT COUNT(*) FROM search_patients_optimized(
                    @TenantId, @SearchTerm, @UHID, @MobileNumber, @Status, @Gender, @City, 999999, 0
                )";

            var offset = (request.PageNumber - 1) * request.PageSize;
            var parameters = new
            {
                TenantId = tenantId,
                SearchTerm = request.SearchTerm,
                UHID = request.UHID,
                MobileNumber = request.MobileNumber,
                Status = request.Status,
                Gender = request.Gender,
                City = request.City,
                PageSize = request.PageSize,
                Offset = offset
            };

            var itemsTask = connection.QueryAsync<Patient>(sql, parameters);
            var countTask = connection.ExecuteScalarAsync<int>(countSql, parameters);

            await Task.WhenAll(itemsTask, countTask);

            return new PagedResult<Patient>
            {
                Items = itemsTask.Result.ToList(),
                TotalCount = countTask.Result,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("Search", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public async Task<List<Patient>> CheckDuplicatesAsync(Guid tenantId, string mobileNumber, string firstName, string lastName, DateTime dateOfBirth)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            using var connection = CreateConnection();
            // Use optimized duplicate detection index
            var sql = @"
                SELECT id, uhid, first_name, last_name, mobile_number, date_of_birth, status
                FROM patients
                WHERE tenant_id = @TenantId AND is_deleted = false
                    AND (mobile_number = @MobileNumber 
                         OR (date_of_birth = @DateOfBirth 
                             AND LOWER(first_name) = LOWER(@FirstName) 
                             AND LOWER(last_name) = LOWER(@LastName)))
                LIMIT 5";
            
            var result = await connection.QueryAsync<Patient>(sql, new 
            { 
                TenantId = tenantId, 
                MobileNumber = mobileNumber, 
                FirstName = firstName, 
                LastName = lastName, 
                DateOfBirth = dateOfBirth 
            });
            
            return result.ToList();
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("CheckDuplicates", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public async Task<PatientStatsResponse> GetStatsAsync(Guid tenantId)
    {
        var cacheKey = $"patient:stats:{tenantId}";
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var cachedStats = await _cache.GetStringAsync(cacheKey);
            if (cachedStats != null)
            {
                return JsonSerializer.Deserialize<PatientStatsResponse>(cachedStats)!;
            }

            using var connection = CreateConnection();
            // Use materialized view for fast stats
            var sql = @"
                SELECT total_patients as TotalPatients,
                       active_patients as ActivePatients,
                       (total_patients - active_patients) as InactivePatients,
                       today_registrations as TodayRegistrations,
                       month_registrations as ThisMonthRegistrations
                FROM patient_stats_mv 
                WHERE tenant_id = @TenantId";

            var stats = await connection.QueryFirstOrDefaultAsync<PatientStatsResponse>(sql, new { TenantId = tenantId });
            
            if (stats == null)
            {
                // Fallback to real-time calculation
                stats = await GetRealTimeStatsAsync(tenantId);
            }

            // Cache for 5 minutes
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(stats), cacheOptions);

            return stats;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("GetStats", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public override async Task<Guid> CreateAsync(Patient patient)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var result = await base.CreateAsync(patient);
            
            // Invalidate related caches
            await InvalidatePatientCaches(patient.TenantId, result);
            
            return result;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("Create", stopwatch.ElapsedMilliseconds, patient.TenantId);
        }
    }

    public override async Task<bool> UpdateAsync(Patient patient)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var result = await base.UpdateAsync(patient);
            
            if (result)
            {
                // Invalidate caches
                await InvalidatePatientCaches(patient.TenantId, patient.Id);
            }
            
            return result;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("Update", stopwatch.ElapsedMilliseconds, patient.TenantId);
        }
    }

    public async Task<string> GenerateUHIDAsync(Guid tenantId, string tenantCode)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            using var connection = CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            
            try
            {
                var year = DateTime.UtcNow.Year;
                
                var seqSql = @"
                    INSERT INTO patient_sequences (id, tenant_id, tenant_code, year, last_sequence, created_at, is_deleted)
                    VALUES (uuid_generate_v4(), @TenantId, @TenantCode, @Year, 1, NOW(), false)
                    ON CONFLICT (tenant_id, year) 
                    DO UPDATE SET 
                        last_sequence = patient_sequences.last_sequence + 1,
                        updated_at = NOW()
                    RETURNING last_sequence";
                
                var sequence = await connection.ExecuteScalarAsync<int>(seqSql, new { TenantId = tenantId, TenantCode = tenantCode, Year = year }, transaction);
                
                transaction.Commit();
                
                return $"PAT-{tenantCode}-{year}-{sequence:D6}";
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("GenerateUHID", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public override async Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy)
    {
        var result = await base.SoftDeleteAsync(id, tenantId, deletedBy);
        
        if (result)
        {
            await InvalidatePatientCaches(tenantId, id);
        }
        
        return result;
    }

    public async Task<bool> MergePatientsAsync(Guid primaryId, Guid secondaryId, Guid tenantId, Guid mergedBy)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            using var connection = CreateConnection();
            using var transaction = connection.BeginTransaction();
            
            try
            {
                var sql = @"
                    UPDATE patients 
                    SET status = 'Merged', 
                        is_deleted = true, 
                        updated_at = @UpdatedAt, 
                        updated_by = @MergedBy
                    WHERE id = @SecondaryId AND tenant_id = @TenantId";
                
                await connection.ExecuteAsync(sql, new 
                { 
                    SecondaryId = secondaryId, 
                    TenantId = tenantId, 
                    UpdatedAt = DateTime.UtcNow, 
                    MergedBy = mergedBy 
                }, transaction);

                await connection.ExecuteAsync(
                    "UPDATE patients SET visit_count = visit_count + (SELECT visit_count FROM patients WHERE id = @SecondaryId) WHERE id = @PrimaryId",
                    new { PrimaryId = primaryId, SecondaryId = secondaryId },
                    transaction
                );

                transaction.Commit();
                
                // Invalidate caches for both patients
                await InvalidatePatientCaches(tenantId, primaryId);
                await InvalidatePatientCaches(tenantId, secondaryId);
                
                return true;
            }
            catch
            {
                transaction.Rollback();
                return false;
            }
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("MergePatients", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    public async Task<bool> IncrementVisitCountAsync(Guid patientId, Guid tenantId)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            using var connection = CreateConnection();
            var sql = "UPDATE patients SET visit_count = visit_count + 1 WHERE id = @PatientId AND tenant_id = @TenantId";
            var rows = await connection.ExecuteAsync(sql, new { PatientId = patientId, TenantId = tenantId });
            
            if (rows > 0)
            {
                await InvalidatePatientCaches(tenantId, patientId);
            }
            
            return rows > 0;
        }
        finally
        {
            stopwatch.Stop();
            await LogQueryPerformance("IncrementVisit", stopwatch.ElapsedMilliseconds, tenantId);
        }
    }

    private async Task<PatientStatsResponse> GetRealTimeStatsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"
            SELECT 
                COUNT(*) FILTER (WHERE is_deleted = false) as TotalPatients,
                COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as ActivePatients,
                COUNT(*) FILTER (WHERE status = 'Inactive' AND is_deleted = false) as InactivePatients,
                COUNT(*) FILTER (WHERE DATE(registration_date) = CURRENT_DATE AND is_deleted = false) as TodayRegistrations,
                COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE) AND is_deleted = false) as ThisMonthRegistrations
            FROM patients
            WHERE tenant_id = @TenantId";

        return await connection.QueryFirstOrDefaultAsync<PatientStatsResponse>(sql, new { TenantId = tenantId }) 
            ?? new PatientStatsResponse();
    }

    private async Task InvalidatePatientCaches(Guid tenantId, Guid patientId)
    {
        try
        {
            var tasks = new List<Task>
            {
                _cache.RemoveAsync($"patient:{tenantId}:{patientId}"),
                _cache.RemoveAsync($"patient:stats:{tenantId}")
            };

            // Also try to remove UHID cache (we don't have UHID here, but it's okay if it fails)
            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate cache for patient {PatientId}", patientId);
        }
    }

    private async Task LogQueryPerformance(string queryType, long executionTimeMs, Guid tenantId)
    {
        try
        {
            if (executionTimeMs > 100) // Log slow queries
            {
                _logger.LogWarning("Slow query detected: {QueryType} took {ExecutionTime}ms for tenant {TenantId}", 
                    queryType, executionTimeMs, tenantId);
            }

            using var connection = CreateConnection();
            await connection.ExecuteAsync(
                "INSERT INTO query_performance_log (query_type, execution_time_ms, tenant_id) VALUES (@QueryType, @ExecutionTime, @TenantId)",
                new { QueryType = queryType, ExecutionTime = executionTimeMs, TenantId = tenantId }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log query performance");
        }
    }

    public async Task<List<Patient>> QuickSearchAsync(string searchTerm, Guid tenantId, int maxResults)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id, tenant_id, uhid, first_name, middle_name, last_name,
            gender, date_of_birth, mobile_number
            FROM patients 
            WHERE tenant_id = @TenantId AND is_deleted = false
                AND (
                    uhid ILIKE @SearchTerm
                    OR first_name ILIKE @SearchTerm
                    OR last_name ILIKE @SearchTerm
                    OR mobile_number ILIKE @SearchTerm
                    OR CONCAT(first_name, ' ', last_name) ILIKE @SearchTerm
                )
            ORDER BY registration_date DESC
            LIMIT @MaxResults";
        
        var result = await connection.QueryAsync<Patient>(sql, new 
        { 
            TenantId = tenantId, 
            SearchTerm = $"%{searchTerm}%", 
            MaxResults = maxResults 
        });
        
        return result.ToList();
    }

    public async Task<List<Patient>> GetRecentPatientsAsync(Guid tenantId, int limit)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id, tenant_id, uhid, first_name, middle_name, last_name,
            gender, date_of_birth, mobile_number
            FROM patients 
            WHERE tenant_id = @TenantId AND is_deleted = false
            ORDER BY registration_date DESC
            LIMIT @Limit";
        
        var result = await connection.QueryAsync<Patient>(sql, new { TenantId = tenantId, Limit = limit });
        return result.ToList();
    }
}