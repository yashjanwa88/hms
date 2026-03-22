using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using PatientService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/dashboard")]
[Authorize]
public class PatientDashboardStatsController : ControllerBase
{
    private readonly IConfiguration _config;

    public PatientDashboardStatsController(IConfiguration config) => _config = config;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

    [HttpGet("stats")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetStats()
    {
        using var conn = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));

        // Core counts
        var core = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                COUNT(*) FILTER (WHERE is_deleted = false) as total,
                COUNT(*) FILTER (WHERE is_deleted = false AND status = 'Active') as active,
                COUNT(*) FILTER (WHERE is_deleted = false AND status != 'Active') as inactive,
                COUNT(*) FILTER (WHERE is_deleted = false AND DATE(registration_date) = CURRENT_DATE) as today,
                COUNT(*) FILTER (WHERE is_deleted = false AND gender = 'Male') as male,
                COUNT(*) FILTER (WHERE is_deleted = false AND gender = 'Female') as female,
                COALESCE(AVG(EXTRACT(YEAR FROM AGE(date_of_birth))) FILTER (WHERE is_deleted = false AND date_of_birth IS NOT NULL), 0) as avg_age
            FROM patients WHERE tenant_id = @TenantId", new { TenantId });

        // Age groups
        var ageGroups = await conn.QueryAsync<dynamic>(@"
            SELECT
                CASE
                    WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 0 AND 18 THEN '0-18'
                    WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 19 AND 35 THEN '19-35'
                    WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 36 AND 50 THEN '36-50'
                    WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 51 AND 65 THEN '51-65'
                    ELSE '65+'
                END as name,
                COUNT(*) as count
            FROM patients
            WHERE tenant_id = @TenantId AND is_deleted = false AND date_of_birth IS NOT NULL
            GROUP BY 1 ORDER BY 1", new { TenantId });

        // Patient types
        var patientTypes = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(pt.type_name, 'Unknown') as name, COUNT(*) as count
            FROM patients p
            LEFT JOIN patient_types pt ON pt.id = p.patient_type_id
            WHERE p.tenant_id = @TenantId AND p.is_deleted = false
            GROUP BY pt.type_name ORDER BY count DESC LIMIT 10", new { TenantId });

        // City wise
        var cityWise = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(NULLIF(city,''), 'Unknown') as name, COUNT(*) as count
            FROM patients
            WHERE tenant_id = @TenantId AND is_deleted = false
            GROUP BY city ORDER BY count DESC LIMIT 6", new { TenantId });

        // Monthly registrations (last 6 months)
        var monthly = await conn.QueryAsync<dynamic>(@"
            SELECT TO_CHAR(registration_date, 'Mon') as name, COUNT(*) as count
            FROM patients
            WHERE tenant_id = @TenantId AND is_deleted = false
            AND registration_date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
            GROUP BY DATE_TRUNC('month', registration_date), TO_CHAR(registration_date, 'Mon')
            ORDER BY DATE_TRUNC('month', registration_date)", new { TenantId });

        // Blood groups
        var bloodGroups = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(NULLIF(blood_group,''), 'Unknown') as name, COUNT(*) as count
            FROM patients
            WHERE tenant_id = @TenantId AND is_deleted = false AND blood_group IS NOT NULL AND blood_group != ''
            GROUP BY blood_group ORDER BY count DESC", new { TenantId });

        var stats = new PatientDashboardStats
        {
            TotalPatients = (long)(core?.total ?? 0),
            TodayRegistrations = (long)(core?.today ?? 0),
            ActivePatients = (long)(core?.active ?? 0),
            InactivePatients = (long)(core?.inactive ?? 0),
            MalePatients = (long)(core?.male ?? 0),
            FemalePatients = (long)(core?.female ?? 0),
            AvgAge = Math.Round((double)(core?.avg_age ?? 0), 1),
            AgeGroupData = ageGroups.Select(r => new ChartDataPoint { Name = r.name, Count = (long)r.count }).ToList(),
            PatientTypeData = patientTypes.Select(r => new ChartDataPoint { Name = r.name, Count = (long)r.count }).ToList(),
            CityWiseData = cityWise.Select(r => new ChartDataPoint { Name = r.name, Count = (long)r.count }).ToList(),
            MonthlyRegistrations = monthly.Select(r => new ChartDataPoint { Name = r.name, Count = (long)r.count }).ToList(),
            BloodGroupData = bloodGroups.Select(r => new ChartDataPoint { Name = r.name, Count = (long)r.count }).ToList(),
            GenderData = new List<ChartDataPoint>
            {
                new() { Name = "Male", Count = (long)(core?.male ?? 0), Color = "#3B82F6" },
                new() { Name = "Female", Count = (long)(core?.female ?? 0), Color = "#EC4899" }
            }
        };

        return Ok(ApiResponse<PatientDashboardStats>.SuccessResponse(stats, "Success"));
    }
}
