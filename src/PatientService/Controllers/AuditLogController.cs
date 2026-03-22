using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/audit-logs")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogRepository _repo;

    public AuditLogController(IAuditLogRepository repo) => _repo = repo;

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

    [HttpGet]
    [RequirePermission("audit.view")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] Guid? patientId,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var filter = new AuditLogFilterRequest
        {
            SearchTerm = search,
            Action = action,
            PatientId = patientId,
            DateFrom = dateFrom != null ? DateTime.Parse(dateFrom) : null,
            DateTo = dateTo != null ? DateTime.Parse(dateTo) : null,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _repo.GetLogsAsync(filter, TenantId);

        var response = result.Items.Select(l => new AuditLogResponse
        {
            Id = l.Id, PatientId = l.PatientId, PatientUHID = l.PatientUHID,
            Action = l.Action, FieldChanged = l.FieldChanged,
            OldValue = l.OldValue, NewValue = l.NewValue,
            Description = l.Description, ChangedByName = l.ChangedByName,
            ChangedByRole = l.ChangedByRole, IpAddress = l.IpAddress,
            ChangedAt = l.ChangedAt
        });

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            items = response,
            totalCount = result.TotalCount,
            pageNumber = result.PageNumber,
            pageSize = result.PageSize
        }, "Success"));
    }
}
