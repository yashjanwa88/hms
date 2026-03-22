using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using PatientService.DTOs;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/walk-in")]
[Authorize]
public class WalkInController : ControllerBase
{
    private readonly IConfiguration _config;

    public WalkInController(IConfiguration config) => _config = config;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());

    [HttpPost]
    [RequirePermission("patient.create")]
    public async Task<IActionResult> CreateWalkIn([FromBody] WalkInPatientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.Gender))
            return BadRequest(ApiResponse<object>.ErrorResponse("FirstName and Gender are required"));

        using var conn = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));

        // Generate UHID: WALK-YYYYMMDD-XXXX
        var seq = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) + 1 FROM patients WHERE tenant_id = @TenantId AND uhid LIKE 'WALK-%' AND DATE(created_at) = CURRENT_DATE",
            new { TenantId });
        var uhid = $"WALK-{DateTime.UtcNow:yyyyMMdd}-{seq:D4}";

        // Calculate approximate DOB from age
        DateTime? dob = request.Age > 0
            ? DateTime.UtcNow.AddYears(-request.Age).Date
            : null;

        var id = Guid.NewGuid();
        await conn.ExecuteAsync(@"INSERT INTO patients (id, tenant_id, uhid, first_name, last_name, gender,
            date_of_birth, mobile_number, status, registration_date, notes, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @UHID, @FirstName, @LastName, @Gender,
            @DOB, @Mobile, 'Active', CURRENT_DATE, @Notes, NOW(), @CreatedBy, false)",
            new
            {
                Id = id, TenantId, UHID = uhid,
                FirstName = request.FirstName,
                LastName = request.LastName ?? "Unknown",
                Gender = request.Gender,
                DOB = dob,
                Mobile = request.MobileNumber,
                Notes = request.ChiefComplaint,
                CreatedBy = UserId
            });

        return Ok(ApiResponse<object>.SuccessResponse(new { id, uhid }, "Walk-in patient registered"));
    }
}
