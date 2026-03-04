using Shared.EventBus.Interfaces;

namespace PharmacyService.DTOs;

// Drug DTOs
public class CreateDrugRequest
{
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string DosageForm { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsControlled { get; set; }
    public bool RequiresPrescription { get; set; }
}

public class UpdateDrugRequest
{
    public string DrugName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string DosageForm { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsControlled { get; set; }
    public bool RequiresPrescription { get; set; }
    public bool IsActive { get; set; }
}

public class DrugResponse
{
    public Guid Id { get; set; }
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string DosageForm { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int ReorderLevel { get; set; }
    public int AvailableStock { get; set; }
    public bool IsControlled { get; set; }
    public bool RequiresPrescription { get; set; }
    public bool IsActive { get; set; }
}

// Batch DTOs
public class CreateBatchRequest
{
    public Guid DrugId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public string? Supplier { get; set; }
}

public class DrugBatchResponse
{
    public Guid Id { get; set; }
    public Guid DrugId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public string? Supplier { get; set; }
    public bool IsExpired { get; set; }
}

// Prescription DTOs
public class CreatePrescriptionRequest
{
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public string? Notes { get; set; }
    public List<CreatePrescriptionItemRequest> Items { get; set; } = new();
}

public class CreatePrescriptionItemRequest
{
    public Guid DrugId { get; set; }
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
}

public class PrescriptionResponse
{
    public Guid Id { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public DateTime? DispensedAt { get; set; }
    public string? DispensedBy { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public List<PrescriptionItemResponse> Items { get; set; } = new();
}

public class PrescriptionItemResponse
{
    public Guid Id { get; set; }
    public Guid DrugId { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public bool IsDispensed { get; set; }
}

public class CancelPrescriptionRequest
{
    public string CancellationReason { get; set; } = string.Empty;
}

public class PrescriptionReceiptResponse
{
    public string PrescriptionNumber { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
    public DateTime? DispensedAt { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public decimal TotalAmount { get; set; }
    public List<ReceiptItemResponse> Items { get; set; } = new();
}

public class ReceiptItemResponse
{
    public string DrugName { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

// Report DTOs
public class DailySalesReportRequest
{
    public DateTime Date { get; set; }
}

public class DailySalesReportResponse
{
    public DateTime Date { get; set; }
    public int TotalPrescriptions { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<DrugSalesItem> TopDrugs { get; set; } = new();
}

public class DrugSalesItem
{
    public string DrugName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}

public class LowStockReportResponse
{
    public List<LowStockItem> Items { get; set; } = new();
}

public class LowStockItem
{
    public Guid DrugId { get; set; }
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
    public int ReorderLevel { get; set; }
    public string Status { get; set; } = string.Empty;
}

// Event DTOs
public class PrescriptionDispensedEvent : IEvent {
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid PrescriptionId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public DateTime DispensedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalItems { get; set; }
}

public class LowStockEvent : IEvent {
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid DrugId { get; set; }
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
    public int ReorderLevel { get; set; }
}

