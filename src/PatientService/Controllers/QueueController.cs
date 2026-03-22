using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/queue")]
[Authorize]
public class QueueController : ControllerBase
{
    private readonly IQueueRepository _repo;

    public QueueController(IQueueRepository repo) => _repo = repo;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());

    [HttpGet]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetQueue(
        [FromQuery] string? date,
        [FromQuery] Guid? doctorId,
        [FromQuery] string? status)
    {
        var queueDate = date != null ? DateTime.Parse(date) : DateTime.UtcNow;
        var queue = await _repo.GetQueueAsync(TenantId, queueDate, doctorId, status);
        var response = queue.Select(q => new QueueResponse
        {
            Id = q.Id, TokenNumber = q.TokenNumber, PatientId = q.PatientId,
            PatientName = q.PatientName, PatientUHID = q.PatientUHID, MobileNumber = q.MobileNumber,
            DepartmentName = q.DepartmentName, DoctorName = q.DoctorName,
            Status = q.Status, Priority = q.Priority,
            RegistrationTime = q.RegistrationTime, CalledTime = q.CalledTime,
            CompletedTime = q.CompletedTime, WaitingMinutes = q.WaitingMinutes
        });
        return Ok(ApiResponse<object>.SuccessResponse(response, "Success"));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? date)
    {
        var queueDate = date != null ? DateTime.Parse(date) : DateTime.UtcNow;
        var stats = await _repo.GetStatsAsync(TenantId, queueDate);
        return Ok(ApiResponse<QueueStatsResponse>.SuccessResponse(stats, "Success"));
    }

    [HttpPost]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> AddToQueue([FromBody] AddToQueueRequest request)
    {
        var deptCode = (request.DepartmentName ?? "OPD").ToUpper().Replace(" ", "").Substring(0, Math.Min(3, (request.DepartmentName ?? "OPD").Length));
        var token = await _repo.GenerateTokenAsync(TenantId, deptCode);

        var queue = new PatientQueue
        {
            TenantId = TenantId, PatientId = request.PatientId,
            TokenNumber = token, DepartmentName = request.DepartmentName,
            DoctorId = request.DoctorId, DoctorName = request.DoctorName,
            Priority = request.Priority, Notes = request.Notes,
            Status = "Waiting", QueueDate = DateTime.UtcNow.Date,
            RegistrationTime = DateTime.UtcNow, CreatedBy = UserId
        };
        var id = await _repo.AddToQueueAsync(queue);
        return Ok(ApiResponse<object>.SuccessResponse(new { id, tokenNumber = token }, "Added to queue"));
    }

    [HttpPatch("{id:guid}/status")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateQueueStatusRequest request)
    {
        var result = await _repo.UpdateStatusAsync(id, TenantId, request.Status, request.CancelReason, UserId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Status updated")) : NotFound();
    }
}
