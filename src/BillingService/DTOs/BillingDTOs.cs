namespace BillingService.DTOs;

public class CreateInvoiceRequest
{
    public Guid PatientId { get; set; }
    public Guid EncounterId { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
}

public class AddInvoiceItemRequest
{
    public string ItemType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class RecordPaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class InvoiceSearchRequest
{
    public Guid? PatientId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "created_at";
    public string SortOrder { get; set; } = "desc";
}

public class InvoiceResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid EncounterId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InvoiceItemResponse> Items { get; set; } = new();
}

public class InvoiceItemResponse
{
    public Guid Id { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

public class ProcessRefundRequest
{
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string RefundMethod { get; set; } = string.Empty; // Cash, Card, UPI, BankTransfer
}

public class RefundResponse
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string RefundMethod { get; set; } = string.Empty;
    public Guid ProcessedBy { get; set; }
    public DateTime ProcessedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class RefundActionRequest
{
    public string Comments { get; set; } = string.Empty;
}
