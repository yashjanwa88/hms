using Shared.Common.Models;

namespace AnalyticsService.Domain;

public class RevenueSummary : BaseEntity
{
    public DateTime Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public int InvoiceCount { get; set; }
    public int PaymentCount { get; set; }
    public string Period { get; set; } = "Daily"; // Daily, Monthly, Yearly
}

public class DoctorPerformance : BaseEntity
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int EncounterCount { get; set; }
    public int PatientCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageRevenuePerEncounter { get; set; }
}

public class InsuranceSummary : BaseEntity
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int TotalClaims { get; set; }
    public int ApprovedClaims { get; set; }
    public int RejectedClaims { get; set; }
    public int SettledClaims { get; set; }
    public decimal TotalClaimAmount { get; set; }
    public decimal ApprovedAmount { get; set; }
    public decimal SettledAmount { get; set; }
    public decimal ApprovalRate { get; set; }
}

public class PatientSummary : BaseEntity
{
    public DateTime Date { get; set; }
    public int NewPatients { get; set; }
    public int TotalEncounters { get; set; }
    public int TotalAppointments { get; set; }
    public decimal AverageRevenuePerPatient { get; set; }
}

public class EventOffset : BaseEntity
{
    public string EventType { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
}
