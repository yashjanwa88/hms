namespace AnalyticsService.DTOs;

public class RevenueRequest
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class RevenueResponse
{
    public DateTime Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public int InvoiceCount { get; set; }
    public int PaymentCount { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class DoctorPerformanceResponse
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int EncounterCount { get; set; }
    public int PatientCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageRevenuePerEncounter { get; set; }
}

public class InsuranceSummaryResponse
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

public class InsuranceApprovalRateResponse
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public decimal ApprovalRate { get; set; }
    public int TotalClaims { get; set; }
    public int ApprovedClaims { get; set; }
}

public class PatientSummaryResponse
{
    public DateTime Date { get; set; }
    public int NewPatients { get; set; }
    public int TotalEncounters { get; set; }
    public int TotalAppointments { get; set; }
    public decimal AverageRevenuePerPatient { get; set; }
}

public class DashboardResponse
{
    public RevenueMetrics Revenue { get; set; } = new();
    public EncounterMetrics Encounters { get; set; } = new();
    public InsuranceMetrics Insurance { get; set; } = new();
    public PatientMetrics Patients { get; set; } = new();
}

public class RevenueMetrics
{
    public decimal TodayRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public decimal YearRevenue { get; set; }
    public decimal GrowthRate { get; set; }
}

public class EncounterMetrics
{
    public int TodayCount { get; set; }
    public int MonthCount { get; set; }
    public int YearCount { get; set; }
}

public class InsuranceMetrics
{
    public int TotalClaims { get; set; }
    public int ApprovedClaims { get; set; }
    public decimal ApprovalRate { get; set; }
    public decimal TotalClaimAmount { get; set; }
}

public class PatientMetrics
{
    public int TodayNew { get; set; }
    public int MonthNew { get; set; }
    public int YearNew { get; set; }
    public int TotalActive { get; set; }
}

public class EncounterCompletedEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid EncounterId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class InvoiceGeneratedEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid PatientId { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime InvoiceDate { get; set; }
}

public class PaymentCompletedEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid PaymentId { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid PatientId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class ClaimSubmittedEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClaimId { get; set; }
    public Guid PolicyId { get; set; }
    public Guid PatientId { get; set; }
    public decimal ClaimAmount { get; set; }
    public string ClaimType { get; set; } = string.Empty;
}

public class ClaimSettledEvent
{
    public Guid EventId { get; set; }
    public DateTime OccurredAt { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClaimId { get; set; }
    public Guid PatientId { get; set; }
    public decimal SettledAmount { get; set; }
}
