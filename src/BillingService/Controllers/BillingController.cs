using BillingService.Application;
using BillingService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;
using Shared.Common.Authorization;

namespace BillingService.Controllers;

[ApiController]
[Route("api/billing/invoices")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingAppService _billingService;

    public BillingController(IBillingAppService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost]
    [RequirePermission("invoice.create")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());
        var tenantCode = "HOSP"; // TODO: Get from tenant service

        var invoice = await _billingService.CreateInvoiceAsync(request, tenantId, userId, tenantCode);

        return Ok(new ApiResponse<InvoiceResponse>
        {
            Success = true,
            Message = "Invoice created successfully",
            Data = invoice
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoiceById(Guid id)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var invoice = await _billingService.GetInvoiceByIdAsync(id, tenantId);

        if (invoice == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Invoice not found"
            });
        }

        return Ok(new ApiResponse<InvoiceResponse>
        {
            Success = true,
            Message = "Success",
            Data = invoice
        });
    }

    [HttpGet("by-encounter/{encounterId}")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> GetInvoiceByEncounter(Guid encounterId)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var invoice = await _billingService.GetInvoiceByEncounterAsync(encounterId, tenantId);

        if (invoice == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Invoice not found"
            });
        }

        return Ok(new ApiResponse<InvoiceResponse>
        {
            Success = true,
            Message = "Success",
            Data = invoice
        });
    }

    [HttpPost("{id}/items")]
    [RequirePermission("invoice.edit")]
    public async Task<IActionResult> AddInvoiceItem(Guid id, [FromBody] AddInvoiceItemRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        var invoice = await _billingService.AddInvoiceItemAsync(id, request, tenantId, userId);

        return Ok(new ApiResponse<InvoiceResponse>
        {
            Success = true,
            Message = "Item added successfully",
            Data = invoice
        });
    }

    [HttpPost("{id}/payment")]
    [RequirePermission("payment.record")]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        var invoice = await _billingService.RecordPaymentAsync(id, request, tenantId, userId);

        return Ok(new ApiResponse<InvoiceResponse>
        {
            Success = true,
            Message = "Payment recorded successfully",
            Data = invoice
        });
    }

    [HttpGet("search")]
    [RequirePermission("invoice.view")]
    public async Task<IActionResult> SearchInvoices([FromQuery] InvoiceSearchRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var result = await _billingService.SearchInvoicesAsync(request, tenantId);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Success",
            Data = result
        });
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "BillingService" });
    }

    [HttpPost("{id}/refund")]
    [RequirePermission("invoice.refund")]
    public async Task<IActionResult> ProcessRefund(Guid id, [FromBody] ProcessRefundRequest request)
    {
        var tenantId = Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
        var userId = Guid.Parse(Request.Headers["X-User-Id"].ToString());

        var refund = await _billingService.ProcessRefundAsync(id, request, tenantId, userId);

        return Ok(new ApiResponse<RefundResponse>
        {
            Success = true,
            Message = "Refund processed successfully",
            Data = refund
        });
    }
}
