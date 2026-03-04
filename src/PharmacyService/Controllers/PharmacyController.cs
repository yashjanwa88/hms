using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyService.Application;
using PharmacyService.DTOs;
using System.Security.Claims;

namespace PharmacyService.Controllers;

[ApiController]
[Route("api/pharmacy")]
[Authorize]
public class PharmacyController : ControllerBase
{
    private readonly IPharmacyAppService _pharmacyService;

    public PharmacyController(IPharmacyAppService pharmacyService)
    {
        _pharmacyService = pharmacyService;
    }

    [HttpPost("drugs")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> CreateDrug([FromBody] CreateDrugRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.CreateDrugAsync(request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("drugs")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetDrugs()
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetDrugsAsync(tenantId);
        return Ok(result);
    }

    [HttpGet("drugs/{id}")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetDrugById(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetDrugByIdAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPut("drugs/{id}")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> UpdateDrug(Guid id, [FromBody] UpdateDrugRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.UpdateDrugAsync(id, request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("batches")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.CreateBatchAsync(request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("batches/by-drug/{drugId}")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> GetBatchesByDrugId(Guid drugId)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetBatchesByDrugIdAsync(drugId, tenantId);
        return Ok(result);
    }

    [HttpPost("prescriptions")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor")]
    public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var tenantCode = User.FindFirst("TenantCode")?.Value ?? "";
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.CreatePrescriptionAsync(request, tenantId, tenantCode, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("prescriptions/{id}")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetPrescriptionById(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetPrescriptionByIdAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("prescriptions/by-patient/{patientId}")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetPrescriptionsByPatientId(Guid patientId)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetPrescriptionsByPatientIdAsync(patientId, tenantId);
        return Ok(result);
    }

    [HttpPost("prescriptions/{id}/verify")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> VerifyPrescription(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.VerifyPrescriptionAsync(id, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("prescriptions/{id}/cancel")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor")]
    public async Task<IActionResult> CancelPrescription(Guid id, [FromBody] CancelPrescriptionRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.CancelPrescriptionAsync(id, request, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("prescriptions/{id}/dispense")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> DispensePrescription(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        
        var result = await _pharmacyService.DispensePrescriptionAsync(id, tenantId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("prescriptions/{id}/receipt")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Pharmacist")]
    public async Task<IActionResult> GetPrescriptionReceipt(Guid id)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetPrescriptionReceiptAsync(id, tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("reports/daily-sales")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist,Accountant")]
    public async Task<IActionResult> GetDailySalesReport([FromQuery] DateTime date)
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetDailySalesReportAsync(date, tenantId);
        return Ok(result);
    }

    [HttpGet("reports/low-stock")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public async Task<IActionResult> GetLowStockReport()
    {
        var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? Guid.Empty.ToString());
        
        var result = await _pharmacyService.GetLowStockReportAsync(tenantId);
        return Ok(result);
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(new { status = "healthy", service = "PharmacyService", timestamp = DateTime.UtcNow });
    }
}
