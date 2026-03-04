namespace PharmacyService.Domain;

public class Drug
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
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
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class DrugBatch
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid DrugId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public string? Supplier { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class Prescription
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, Verified, Dispensed, Cancelled
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public DateTime? DispensedAt { get; set; }
    public string? DispensedBy { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class PrescriptionItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PrescriptionId { get; set; }
    public Guid DrugId { get; set; }
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public bool IsDispensed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class DispenseLog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PrescriptionItemId { get; set; }
    public Guid DrugBatchId { get; set; }
    public int QuantityDispensed { get; set; }
    public DateTime DispensedAt { get; set; }
    public string DispensedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}

public class PharmacySequence
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
    public DateTime UpdatedAt { get; set; }
}
