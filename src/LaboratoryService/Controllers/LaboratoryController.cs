using LaboratoryService.Application;
using LaboratoryService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Authorization;
using System.Security.Claims;

namespace LaboratoryService.Controllers;

[ApiController]
[Route("api/lab")]
[Authorize]
public class LaboratoryController : ControllerBase
{
    private readonly ILaboratoryAppService _labService;

    public LaboratoryController(ILaboratoryAppService labService)
    {
        _labService = labService;
    }

    [HttpPost("tests")]
    [RequirePermission("lab.test.manage")]
    public async Task<IActionResult> CreateLabTest([FromBody] CreateLabTestRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.CreateLabTestAsync(request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("tests")]
    [RequirePermission("lab.view")]
    public async Task<IActionResult> GetLabTests()
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _labService.GetLabTestsAsync(tenantId);
        return Ok(result);
    }

    [HttpGet("tests/{id}")]
    [RequirePermission("lab.view")]
    public async Task<IActionResult> GetLabTestById(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _labService.GetLabTestByIdAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("orders")]
    [RequirePermission("lab.order.create")]
    public async Task<IActionResult> CreateLabOrder([FromBody] CreateLabOrderRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var tenantCode = User.FindFirst("TenantCode")?.Value ?? "";
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.CreateLabOrderAsync(request, tenantId, tenantCode, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("orders/{id}")]
    [RequirePermission("lab.view")]
    public async Task<IActionResult> GetLabOrderById(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _labService.GetLabOrderByIdAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("orders/by-patient/{patientId}")]
    [RequirePermission("lab.view")]
    public async Task<IActionResult> GetLabOrdersByPatientId(Guid patientId)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _labService.GetLabOrdersByPatientIdAsync(patientId, tenantId);
        return Ok(result);
    }

    [HttpPost("orders/{id}/collect-sample")]
    [RequirePermission("lab.sample.collect")]
    public async Task<IActionResult> CollectSample(Guid id, [FromBody] CollectSampleRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.CollectSampleAsync(id, request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("orders/{id}/cancel")]
    [RequirePermission("lab.order.cancel")]
    public async Task<IActionResult> CancelLabOrder(Guid id, [FromBody] CancelLabOrderRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.CancelLabOrderAsync(id, request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("orders/{orderId}/items/{itemId}/results")]
    [RequirePermission("lab.result.enter")]
    public async Task<IActionResult> EnterLabResults(Guid orderId, Guid itemId, [FromBody] EnterLabResultsRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.EnterLabResultsAsync(orderId, itemId, request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("orders/{id}/complete")]
    [RequirePermission("lab.order.complete")]
    public async Task<IActionResult> CompleteLabOrder(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _labService.CompleteLabOrderAsync(id, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("orders/{id}/report")]
    [RequirePermission("lab.view")]
    public async Task<IActionResult> GetLabReport(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _labService.GetLabReportAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(new { status = "healthy", service = "LaboratoryService", timestamp = DateTime.UtcNow });
    }
}
