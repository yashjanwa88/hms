using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/card-reprint")]
[Authorize]
public class CardReprintController : ControllerBase
{
    private readonly ICardReprintRepository _repo;

    public CardReprintController(ICardReprintRepository repo) => _repo = repo;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());
    private string UserName => Request.Headers["X-User-Name"].ToString();

    [HttpGet("search")]
    public async Task<IActionResult> SearchPatient([FromQuery] string term)
    {
        if (string.IsNullOrWhiteSpace(term))
            return BadRequest(ApiResponse<object>.ErrorResponse("Search term required"));

        var result = await _repo.GetPatientReprintInfoAsync(term, TenantId);
        if (result == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Patient not found"));

        return Ok(ApiResponse<CardReprintSearchResponse>.SuccessResponse(result, "Success"));
    }

    [HttpPost]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> CreateReprint([FromBody] CardReprintRequest request)
    {
        var reprint = new PatientCardReprint
        {
            TenantId = TenantId, PatientId = request.PatientId,
            Reason = request.Reason, Charges = request.Charges,
            PaymentMode = request.PaymentMode, PaymentReference = request.PaymentReference,
            ReprintedBy = UserId,
            ReprintedByName = string.IsNullOrEmpty(UserName) ? "System" : UserName,
            ReprintedAt = DateTime.UtcNow, Notes = request.Notes, CreatedBy = UserId
        };
        var id = await _repo.CreateReprintAsync(reprint);
        return Ok(ApiResponse<object>.SuccessResponse(new { id, reprintNumber = reprint.ReprintNumber }, "Reprint recorded"));
    }

    [HttpGet("{patientId:guid}/history")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetHistory(Guid patientId)
    {
        var history = await _repo.GetReprintHistoryAsync(patientId, TenantId);
        return Ok(ApiResponse<object>.SuccessResponse(history, "Success"));
    }
}
