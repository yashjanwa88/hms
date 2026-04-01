using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Shared.Common.Models;
using Shared.Common.Authorization;
using System.Diagnostics;
using Dapper;
using Npgsql;
using System.Linq;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients/{patientId:guid}/timeline")]
public class PatientTimelineController : ControllerBase
{
    private readonly ILogger<PatientTimelineController> _logger;
    private readonly string _connectionString;

    public PatientTimelineController(ILogger<PatientTimelineController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
    }

    private NpgsqlConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());

    [HttpGet]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetTimeline(Guid patientId, [FromQuery] string? type, [FromQuery] int pageSize = 20, [FromQuery] int pageNumber = 1)
    {
        var requestId = HttpContext.TraceIdentifier;
        _logger.LogInformation("[{RequestId}] Fetching timeline for patient {PatientId}. Type: {Type}", requestId, patientId, type);
        
        using var conn = CreateConnection();
        var offset = (pageNumber - 1) * pageSize;

        var where = "WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false";
        var p = new DynamicParameters();
        p.Add("PatientId", patientId);
        p.Add("TenantId", TenantId);

        if (!string.IsNullOrEmpty(type) && type != "All")
        {
            where += " AND event_type = @Type";
            p.Add("Type", type);
        }

        var sql = $@"
            SELECT 
                id, tenant_id as tenantId, patient_id as patientId, 
                event_type as eventType, event_title as eventTitle, 
                event_description as eventDescription, event_date as eventDate, 
                source_module as sourceModule, source_id as sourceId, 
                doctor_id as doctorId, doctor_name as doctorName, 
                status, metadata as metadataJson, created_at as createdAt
            FROM patient_event_timeline
            {where}
            ORDER BY event_date DESC
            LIMIT @Limit OFFSET @Offset";

        var countSql = $"SELECT COUNT(*) FROM patient_event_timeline {where}";

        p.Add("Limit", pageSize);
        p.Add("Offset", offset);

        var items = await conn.QueryAsync<dynamic>(sql, p);
        var total = await conn.ExecuteScalarAsync<int>(countSql, p);

        var result = new PagedResult<dynamic>
        {
            Items = items.ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<dynamic>>.SuccessResponse(result, "Timeline retrieved successfully"));
    }

    [HttpPost("event")]
    [RequirePermission("patient.update")]
    public async Task<IActionResult> AddEvent(Guid patientId, [FromBody] dynamic timelineEvent)
    {
        // Internal method for other services to record events
        // In a real microservice, this would be triggered by an EventBus consumer
        using var conn = CreateConnection();
        
        var id = Guid.NewGuid();
        await conn.ExecuteAsync(@"
            INSERT INTO patient_event_timeline (
                id, tenant_id, patient_id, event_type, event_title, 
                event_description, event_date, source_module, source_id, 
                doctor_id, doctor_name, status, created_at, is_deleted
            ) VALUES (
                @Id, @TenantId, @PatientId, @EventType, @EventTitle, 
                @EventDescription, @EventDate, @SourceModule, @SourceId, 
                @DoctorId, @DoctorName, @Status, NOW(), false
            )", new {
                Id = id,
                TenantId,
                PatientId = patientId,
                EventType = (string)timelineEvent.eventType,
                EventTitle = (string)timelineEvent.eventTitle,
                EventDescription = (string)timelineEvent.eventDescription,
                EventDate = timelineEvent.eventDate ?? DateTime.UtcNow,
                SourceModule = (string)timelineEvent.sourceModule,
                SourceId = (Guid?)timelineEvent.sourceId,
                DoctorId = (Guid?)timelineEvent.doctorId,
                DoctorName = (string)timelineEvent.doctorName,
                Status = (string)timelineEvent.status
            });

        return Ok(ApiResponse<Guid>.SuccessResponse(id, "Event recorded in timeline"));
    }
}
