using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class RenewalController : ControllerBase
{
    private readonly IRenewalRepository _repo;

    public RenewalController(IRenewalRepository repo) => _repo = repo;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());

    [HttpGet("renewal/search")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> SearchPatient([FromQuery] string term)
    {
        if (string.IsNullOrWhiteSpace(term))
            return BadRequest(ApiResponse<object>.ErrorResponse("Search term required"));

        var result = await _repo.GetPatientRenewalInfoAsync(term, TenantId);
        if (result == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

        return Ok(ApiResponse<RenewalSearchResponse>.SuccessResponse(result, "Success"));
    }

    [HttpPost("renewal")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> RenewPatient([FromBody] RenewPatientRequest request)
    {
        // Get current valid_till by patient ID - search by UUID directly
        using var conn = new Npgsql.NpgsqlConnection(
            HttpContext.RequestServices.GetRequiredService<IConfiguration>().GetConnectionString("DefaultConnection"));
        var currentValidTill = await conn.QueryFirstOrDefaultAsync<DateTime?>(
            "SELECT valid_till FROM patients WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false",
            new { Id = request.PatientId, TenantId });

        var renewal = new PatientRenewal
        {
            TenantId = TenantId, PatientId = request.PatientId,
            PreviousValidTill = currentValidTill ?? DateTime.UtcNow,
            NewValidTill = (currentValidTill ?? DateTime.UtcNow).AddDays(request.RenewalPeriodDays),
            RenewalPeriodDays = request.RenewalPeriodDays,
            RenewalFee = request.RenewalFee, Discount = request.Discount,
            FinalAmount = request.FinalAmount, PaymentMode = request.PaymentMode,
            PaymentReference = request.PaymentReference, Notes = request.Notes,
            RenewedBy = UserId, RenewedAt = DateTime.UtcNow, CreatedBy = UserId
        };
        var id = await _repo.CreateRenewalAsync(renewal);
        return Ok(ApiResponse<object>.SuccessResponse(new { id, renewalNumber = renewal.RenewalNumber, newValidTill = renewal.NewValidTill }, "Renewed successfully"));
    }

    [HttpGet("{patientId:guid}/renewal/history")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetRenewalHistory(Guid patientId)
    {
        var history = await _repo.GetRenewalHistoryAsync(patientId, TenantId);
        return Ok(ApiResponse<object>.SuccessResponse(history, "Success"));
    }

    [HttpGet("renewal/expiring")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetExpiringPatients([FromQuery] int daysAhead = 30)
    {
        var result = await _repo.GetExpiringPatientsAsync(TenantId, daysAhead);
        return Ok(ApiResponse<object>.SuccessResponse(result, "Success"));
    }
}
