using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/{patientId:guid}/appointments")]
[Authorize]
public class AppointmentHistoryController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<AppointmentHistoryController> _logger;

    public AppointmentHistoryController(IConfiguration config, ILogger<AppointmentHistoryController> logger)
    {
        _config = config;
        _logger = logger;
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

    // ── GET /api/patients/{patientId}/appointments ─────────────────────────────

    [HttpGet]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetAppointments(
        Guid patientId,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var connStr = _config.GetConnectionString("AppointmentConnection");

        // Fallback: if AppointmentConnection not configured, return empty with message
        if (string.IsNullOrEmpty(connStr))
        {
            _logger.LogWarning("AppointmentConnection not configured. Returning empty appointment history.");
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items = Array.Empty<object>(),
                totalCount = 0,
                pageNumber,
                pageSize,
                message = "Appointment service not connected"
            }, "No appointment data available"));
        }

        try
        {
            using var conn = new NpgsqlConnection(connStr);

            var where = "WHERE a.patient_id = @PatientId AND a.tenant_id = @TenantId AND a.is_deleted = false";
            var p = new DynamicParameters();
            p.Add("PatientId", patientId);
            p.Add("TenantId", TenantId);

            if (!string.IsNullOrEmpty(status) && status != "All")
            { where += " AND a.status = @Status"; p.Add("Status", status); }

            var offset = (pageNumber - 1) * pageSize;
            p.Add("PageSize", pageSize);
            p.Add("Offset", offset);

            var sql = $@"SELECT
                a.id as appointmentId,
                a.appointment_number as appointmentNumber,
                a.appointment_date as appointmentDate,
                a.appointment_time as appointmentTime,
                a.doctor_id as doctorId,
                a.doctor_name as doctorName,
                a.department_name as departmentName,
                a.status,
                a.visit_type as visitType,
                a.chief_complaint as chiefComplaint,
                a.notes,
                a.created_at as createdAt
                FROM appointments a
                {where}
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
                LIMIT @PageSize OFFSET @Offset";

            var countSql = $"SELECT COUNT(*) FROM appointments a {where}";

            var items = await conn.QueryAsync<dynamic>(sql, p);
            var total = await conn.ExecuteScalarAsync<int>(countSql, p);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items,
                totalCount = total,
                pageNumber,
                pageSize
            }, "Success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch appointment history for patient {PatientId}", patientId);
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                items = Array.Empty<object>(),
                totalCount = 0,
                pageNumber,
                pageSize
            }, "Appointment service unavailable"));
        }
    }
}
