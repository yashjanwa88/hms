using Shared.Common.Models;

namespace BillingService.Domain;

public class Invoice : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid EncounterId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Partial, Paid, Cancelled
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
}

public class InvoiceItem
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string ItemType { get; set; } = string.Empty; // Consultation, Lab, Medicine, Procedure, Other
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class InvoiceSequence : BaseEntity
{
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
}

public class Refund
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string RefundMethod { get; set; } = string.Empty;
    public Guid ProcessedBy { get; set; }
    public DateTime ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public bool IsDeleted { get; set; }
}
