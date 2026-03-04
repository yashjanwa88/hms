using BillingService.Domain;
using BillingService.DTOs;
using BillingService.Repositories;
using Shared.Common.Models;

namespace BillingService.Application;

public interface IBillingAppService
{
    Task<InvoiceResponse> CreateInvoiceAsync(CreateInvoiceRequest request, Guid tenantId, Guid createdBy, string tenantCode);
    Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id, Guid tenantId);
    Task<InvoiceResponse?> GetInvoiceByEncounterAsync(Guid encounterId, Guid tenantId);
    Task<InvoiceResponse> AddInvoiceItemAsync(Guid invoiceId, AddInvoiceItemRequest request, Guid tenantId, Guid createdBy);
    Task<InvoiceResponse> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid tenantId, Guid updatedBy);
    Task<PagedResult<InvoiceResponse>> SearchInvoicesAsync(InvoiceSearchRequest request, Guid tenantId);
    Task<RefundResponse> ProcessRefundAsync(Guid invoiceId, ProcessRefundRequest request, Guid tenantId, Guid processedBy);
    Task<List<RefundResponse>> GetPendingRefundsAsync(Guid tenantId);
    Task ApproveRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy);
    Task RejectRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy);
}

public class BillingAppService : IBillingAppService
{
    private readonly IBillingRepository _billingRepository;
    private readonly ILogger<BillingAppService> _logger;
    private readonly Shared.Common.Services.IAuditClient _auditClient;

    public BillingAppService(
        IBillingRepository billingRepository,
        ILogger<BillingAppService> logger,
        Shared.Common.Services.IAuditClient auditClient)
    {
        _billingRepository = billingRepository;
        _logger = logger;
        _auditClient = auditClient;
    }

    public async Task<InvoiceResponse> CreateInvoiceAsync(CreateInvoiceRequest request, Guid tenantId, Guid createdBy, string tenantCode)
    {
        // Check if invoice already exists for this encounter
        var existing = await _billingRepository.GetInvoiceByEncounterAsync(request.EncounterId, tenantId);
        if (existing != null)
        {
            throw new Exception("Invoice already exists for this encounter");
        }

        // Generate invoice number
        var invoiceNumber = await _billingRepository.GenerateInvoiceNumberAsync(tenantId, tenantCode);

        // Create invoice
        var invoice = new Invoice
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            InvoiceNumber = invoiceNumber,
            Tax = request.Tax,
            Discount = request.Discount,
            Subtotal = 0,
            GrandTotal = request.Tax - request.Discount,
            PaidAmount = 0,
            CreatedBy = createdBy
        };

        await _billingRepository.CreateInvoiceAsync(invoice);

        _ = _auditClient.LogAsync("BillingService", "Invoice", invoice.Id, "CREATE", 
            null, invoice, createdBy, tenantId);

        return await GetInvoiceByIdAsync(invoice.Id, tenantId) ?? throw new Exception("Failed to retrieve created invoice");
    }

    public async Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id, Guid tenantId)
    {
        var invoice = await _billingRepository.GetInvoiceByIdAsync(id, tenantId);
        if (invoice == null) return null;

        var items = await _billingRepository.GetInvoiceItemsAsync(id);

        return MapToResponse(invoice, items);
    }

    public async Task<InvoiceResponse?> GetInvoiceByEncounterAsync(Guid encounterId, Guid tenantId)
    {
        var invoice = await _billingRepository.GetInvoiceByEncounterAsync(encounterId, tenantId);
        if (invoice == null) return null;

        var items = await _billingRepository.GetInvoiceItemsAsync(invoice.Id);

        return MapToResponse(invoice, items);
    }

    public async Task<InvoiceResponse> AddInvoiceItemAsync(Guid invoiceId, AddInvoiceItemRequest request, Guid tenantId, Guid createdBy)
    {
        var invoice = await _billingRepository.GetInvoiceByIdAsync(invoiceId, tenantId);
        if (invoice == null)
        {
            throw new Exception("Invoice not found");
        }

        if (invoice.Status == "Paid")
        {
            throw new Exception("Cannot modify paid invoice");
        }

        // Add item
        var item = new InvoiceItem
        {
            InvoiceId = invoiceId,
            ItemType = request.ItemType,
            Description = request.Description,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            CreatedBy = createdBy
        };

        await _billingRepository.AddInvoiceItemAsync(item);

        _ = _auditClient.LogAsync("BillingService", "InvoiceItem", item.Id, "CREATE", 
            null, item, createdBy, tenantId);

        // Recalculate totals
        await _billingRepository.RecalculateInvoiceTotalsAsync(invoiceId, tenantId);

        return await GetInvoiceByIdAsync(invoiceId, tenantId) ?? throw new Exception("Failed to retrieve updated invoice");
    }

    public async Task<InvoiceResponse> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid tenantId, Guid updatedBy)
    {
        var invoice = await _billingRepository.GetInvoiceByIdAsync(invoiceId, tenantId);
        if (invoice == null)
        {
            throw new Exception("Invoice not found");
        }

        if (invoice.Status == "Cancelled")
        {
            throw new Exception("Cannot record payment for cancelled invoice");
        }

        // Update paid amount
        invoice.PaidAmount += request.Amount;
        invoice.PaymentMethod = request.PaymentMethod;
        invoice.PaymentDate = DateTime.UtcNow;
        invoice.UpdatedBy = updatedBy;

        // Update status based on payment
        if (invoice.PaidAmount >= invoice.GrandTotal)
        {
            invoice.Status = "Paid";
            invoice.PaidAmount = invoice.GrandTotal; // Cap at grand total
        }
        else if (invoice.PaidAmount > 0)
        {
            invoice.Status = "Partial";
        }

        await _billingRepository.UpdateInvoiceAsync(invoice);

        _ = _auditClient.LogAsync("BillingService", "Payment", invoiceId, "PAYMENT", 
            new { OldPaidAmount = invoice.PaidAmount - request.Amount, OldStatus = invoice.Status }, 
            new { NewPaidAmount = invoice.PaidAmount, NewStatus = invoice.Status, PaymentMethod = request.PaymentMethod, Amount = request.Amount }, 
            updatedBy, tenantId);

        return await GetInvoiceByIdAsync(invoiceId, tenantId) ?? throw new Exception("Failed to retrieve updated invoice");
    }

    public async Task<PagedResult<InvoiceResponse>> SearchInvoicesAsync(InvoiceSearchRequest request, Guid tenantId)
    {
        var result = await _billingRepository.SearchInvoicesAsync(request, tenantId);

        var responses = new List<InvoiceResponse>();
        foreach (var invoice in result.Items)
        {
            var items = await _billingRepository.GetInvoiceItemsAsync(invoice.Id);
            responses.Add(MapToResponse(invoice, items));
        }

        return new PagedResult<InvoiceResponse>
        {
            Items = responses,
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<RefundResponse> ProcessRefundAsync(Guid invoiceId, ProcessRefundRequest request, Guid tenantId, Guid processedBy)
    {
        var invoice = await _billingRepository.GetInvoiceByIdAsync(invoiceId, tenantId);
        if (invoice == null)
        {
            throw new Exception("Invoice not found");
        }

        if (invoice.Status != "Paid")
        {
            throw new Exception("Only paid invoices can be refunded");
        }

        if (request.RefundAmount <= 0 || request.RefundAmount > invoice.PaidAmount)
        {
            throw new Exception("Invalid refund amount");
        }

        var refund = new Refund
        {
            TenantId = tenantId,
            InvoiceId = invoiceId,
            RefundAmount = request.RefundAmount,
            Reason = request.Reason,
            RefundMethod = request.RefundMethod,
            ProcessedBy = processedBy,
            CreatedBy = processedBy
        };

        await _billingRepository.ProcessRefundAsync(refund);

        _ = _auditClient.LogAsync("BillingService", "Refund", refund.Id, "REFUND",
            new { InvoiceId = invoiceId, InvoiceNumber = invoice.InvoiceNumber },
            new { RefundAmount = request.RefundAmount, Reason = request.Reason, RefundMethod = request.RefundMethod },
            processedBy, tenantId);

        return new RefundResponse
        {
            Id = refund.Id,
            InvoiceId = invoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            RefundAmount = request.RefundAmount,
            Reason = request.Reason,
            RefundMethod = request.RefundMethod,
            ProcessedBy = processedBy,
            ProcessedAt = refund.ProcessedAt,
            Status = "Pending"
        };
    }

    public async Task<List<RefundResponse>> GetPendingRefundsAsync(Guid tenantId)
    {
        try
        {
            var refunds = await _billingRepository.GetPendingRefundsAsync(tenantId);
            if (refunds == null || !refunds.Any()) return new List<RefundResponse>();
            
            return refunds.Select(r => new RefundResponse
            {
                Id = (Guid)r.id,
                InvoiceId = (Guid)r.invoice_id,
                InvoiceNumber = r.invoice_number?.ToString() ?? "",
                RefundAmount = (decimal)r.refund_amount,
                Reason = r.reason?.ToString() ?? "",
                RefundMethod = r.refund_method?.ToString() ?? "",
                ProcessedBy = (Guid)r.processed_by,
                ProcessedAt = (DateTime)r.processed_at,
                Status = r.status?.ToString() ?? "Pending"
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending refunds");
            return new List<RefundResponse>();
        }
    }

    public async Task ApproveRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy)
    {
        await _billingRepository.ApproveRefundAsync(refundId, comments, tenantId, approvedBy);
        _ = _auditClient.LogAsync("BillingService", "Refund", refundId, "APPROVE",
            null, new { Comments = comments }, approvedBy, tenantId);
    }

    public async Task RejectRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy)
    {
        await _billingRepository.RejectRefundAsync(refundId, comments, tenantId, approvedBy);
        _ = _auditClient.LogAsync("BillingService", "Refund", refundId, "REJECT",
            null, new { Comments = comments }, approvedBy, tenantId);
    }

    private static InvoiceResponse MapToResponse(Invoice invoice, List<InvoiceItem> items)
    {
        return new InvoiceResponse
        {
            Id = invoice.Id,
            PatientId = invoice.PatientId,
            EncounterId = invoice.EncounterId,
            InvoiceNumber = invoice.InvoiceNumber,
            Subtotal = invoice.Subtotal,
            Tax = invoice.Tax,
            Discount = invoice.Discount,
            GrandTotal = invoice.GrandTotal,
            PaidAmount = invoice.PaidAmount,
            BalanceAmount = invoice.GrandTotal - invoice.PaidAmount,
            Status = invoice.Status,
            PaymentMethod = invoice.PaymentMethod,
            PaymentDate = invoice.PaymentDate,
            CreatedAt = invoice.CreatedAt,
            Items = items.Select(i => new InvoiceItemResponse
            {
                Id = i.Id,
                ItemType = i.ItemType,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };
    }
}
