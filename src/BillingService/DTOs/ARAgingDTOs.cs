namespace BillingService.DTOs;

public class ARAgingRequest
{
    public DateTime? AsOfDate { get; set; } = DateTime.UtcNow;
    public Guid? PatientId { get; set; }
    public string? Department { get; set; }
    public Guid? DoctorId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class ARAgingResponse
{
    public Guid PatientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public DateTime InvoiceDate { get; set; }
    public int DaysOutstanding { get; set; }
    public string AgingBucket { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ARAgingSummaryResponse
{
    public decimal Total0To30 { get; set; }
    public decimal Total31To60 { get; set; }
    public decimal Total61To90 { get; set; }
    public decimal TotalOver90 { get; set; }
    public decimal GrandTotal { get; set; }
    public int TotalInvoices { get; set; }
}

public class RevenueReportRequest
{
    public DateTime FromDate { get; set; } = DateTime.UtcNow.AddDays(-30);
    public DateTime ToDate { get; set; } = DateTime.UtcNow;
    public string? Department { get; set; }
    public Guid? DoctorId { get; set; }
    public string GroupBy { get; set; } = "daily"; // daily, weekly, monthly
}

public class RevenueReportResponse
{
    public DateTime ReportDate { get; set; }
    public string? Department { get; set; }
    public Guid? DoctorId { get; set; }
    public int TotalInvoices { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal CollectionRate { get; set; }
}