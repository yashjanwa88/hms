using Microsoft.AspNetCore.Mvc;

namespace EMRService.Controllers;

[ApiController]
[Route("api/emr")]
public class HealthController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            Service = "EMRService",
            Status = "Healthy",
            Timestamp = DateTime.UtcNow
        });
    }
}
