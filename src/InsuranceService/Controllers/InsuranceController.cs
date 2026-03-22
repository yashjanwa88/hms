using InsuranceService.Application;
using InsuranceService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Shared.Common.Authorization;
using System.Security.Claims;

namespace InsuranceService.Controllers;

[ApiController]
[Route("api/insurance")]
[Authorize]
public class InsuranceController : ControllerBase
{
    private readonly IInsuranceService _insuranceService;

    public InsuranceController(IInsuranceService insuranceService)
    {
        _insuranceService = insuranceService;
    }

    [HttpPost("providers")]
    [RequirePermission("insurance.provider.create")]
    public async Task<IActionResult> CreateProvider([FromBody] CreateProviderRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));

            var result = await _insuranceService.CreateProviderAsync(request, tenantId, userId);
            return Ok(ApiResponse<ProviderResponse>.SuccessResponse(result, "Provider created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ProviderResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("providers")]
    [RequirePermission("insurance.view")]
    public async Task<IActionResult> GetProviders()
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));

            var result = await _insuranceService.GetProvidersAsync(tenantId);
            return Ok(ApiResponse<List<ProviderResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<ProviderResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("policies")]
    [RequirePermission("insurance.policy.create")]
    public async Task<IActionResult> CreatePolicy([FromBody] CreatePolicyRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.CreatePolicyAsync(request, tenantId, userId, token);
            return Ok(ApiResponse<PolicyResponse>.SuccessResponse(result, "Policy created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PolicyResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("policies/by-patient/{patientId}")]
    [RequirePermission("insurance.view")]
    public async Task<IActionResult> GetPoliciesByPatient(Guid patientId)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.GetPoliciesByPatientIdAsync(patientId, tenantId, token);
            return Ok(ApiResponse<List<PolicyResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<PolicyResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("preauth")]
    [RequirePermission("insurance.preauth.create")]
    public async Task<IActionResult> CreatePreAuth([FromBody] CreatePreAuthRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var tenantCode = User.FindFirst("TenantCode")?.Value ?? throw new Exception("TenantCode not found");
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.CreatePreAuthAsync(request, tenantId, tenantCode, userId, token);
            return Ok(ApiResponse<PreAuthResponse>.SuccessResponse(result, "PreAuth created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PreAuthResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("preauth/{id}")]
    [RequirePermission("insurance.view")]
    public async Task<IActionResult> GetPreAuth(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.GetPreAuthByIdAsync(id, tenantId, token);
            if (result == null) return NotFound(ApiResponse<PreAuthResponse>.ErrorResponse("PreAuth not found"));

            return Ok(ApiResponse<PreAuthResponse>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PreAuthResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("preauth/{id}/approve")]
    [RequirePermission("insurance.preauth.approve")]
    public async Task<IActionResult> ApprovePreAuth(Guid id, [FromBody] ApprovePreAuthRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));

            var result = await _insuranceService.ApprovePreAuthAsync(id, request, tenantId, userId);
            if (!result) return NotFound(ApiResponse<bool>.ErrorResponse("PreAuth not found"));

            return Ok(ApiResponse<bool>.SuccessResponse(result, "PreAuth approved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("preauth/{id}/reject")]
    [RequirePermission("insurance.preauth.approve")]
    public async Task<IActionResult> RejectPreAuth(Guid id, [FromBody] RejectPreAuthRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));

            var result = await _insuranceService.RejectPreAuthAsync(id, request, tenantId, userId);
            if (!result) return NotFound(ApiResponse<bool>.ErrorResponse("PreAuth not found"));

            return Ok(ApiResponse<bool>.SuccessResponse(result, "PreAuth rejected successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("claims")]
    [RequirePermission("insurance.claim.create")]
    public async Task<IActionResult> CreateClaim([FromBody] CreateClaimRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var tenantCode = User.FindFirst("TenantCode")?.Value ?? throw new Exception("TenantCode not found");
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.CreateClaimAsync(request, tenantId, tenantCode, userId, token);
            return Ok(ApiResponse<ClaimResponse>.SuccessResponse(result, "Claim submitted successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ClaimResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("claims/{id}")]
    [RequirePermission("insurance.view")]
    public async Task<IActionResult> GetClaim(Guid id)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.GetClaimByIdAsync(id, tenantId, token);
            if (result == null) return NotFound(ApiResponse<ClaimResponse>.ErrorResponse("Claim not found"));

            return Ok(ApiResponse<ClaimResponse>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ClaimResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("claims/by-invoice/{invoiceId}")]
    [RequirePermission("insurance.view")]
    public async Task<IActionResult> GetClaimsByInvoice(Guid invoiceId)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var result = await _insuranceService.GetClaimsByInvoiceIdAsync(invoiceId, tenantId, token);
            return Ok(ApiResponse<List<ClaimResponse>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<ClaimResponse>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("claims/{id}/update-status")]
    [RequirePermission("insurance.claim.admin")]
    public async Task<IActionResult> UpdateClaimStatus(Guid id, [FromBody] UpdateClaimStatusRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));

            var result = await _insuranceService.UpdateClaimStatusAsync(id, request, tenantId, userId);
            if (!result) return NotFound(ApiResponse<bool>.ErrorResponse("Claim not found"));

            return Ok(ApiResponse<bool>.SuccessResponse(result, "Claim status updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("claims/{id}/settle")]
    [RequirePermission("insurance.claim.settle")]
    public async Task<IActionResult> SettleClaim(Guid id, [FromBody] SettleClaimRequest request)
    {
        try
        {
            var tenantId = Guid.Parse(User.FindFirst("TenantId")?.Value ?? throw new Exception("TenantId not found"));
            var tenantCode = User.FindFirst("TenantCode")?.Value ?? throw new Exception("TenantCode not found");
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("UserId not found"));

            var result = await _insuranceService.SettleClaimAsync(id, request, tenantId, tenantCode, userId);
            return Ok(ApiResponse<SettlementResponse>.SuccessResponse(result, "Claim settled successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<SettlementResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "InsuranceService", timestamp = DateTime.UtcNow });
    }
}
