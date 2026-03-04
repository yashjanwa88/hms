using BillingService.Application;
using BillingService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace BillingService.Controllers;

[ApiController]
[Route("api/billing/v1/refunds")]
public class RefundController : ControllerBase
{
    private readonly IBillingAppService _billingService;

    public RefundController(IBillingAppService billingService)
    {
        _billingService = billingService;
    }

    [HttpGet("pending")]
    [RequirePermission("refund.view")]
    public async Task<IActionResult> GetPendingRefunds()
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var refunds = await _billingService.GetPendingRefundsAsync(tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Pending refunds retrieved successfully",
            Data = new { items = refunds }
        });
    }

    [HttpPost("{id}/approve")]
    [RequirePermission("refund.approve")]
    public async Task<IActionResult> ApproveRefund(Guid id, [FromBody] RefundActionRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        await _billingService.ApproveRefundAsync(id, request.Comments, tenantId, userId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Refund approved successfully"
        });
    }

    [HttpPost("{id}/reject")]
    [RequirePermission("refund.approve")]
    public async Task<IActionResult> RejectRefund(Guid id, [FromBody] RefundActionRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        await _billingService.RejectRefundAsync(id, request.Comments, tenantId, userId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Refund rejected successfully"
        });
    }
}
