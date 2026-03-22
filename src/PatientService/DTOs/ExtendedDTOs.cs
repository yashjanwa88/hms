namespace PatientService.DTOs;

// ── Masters ───────────────────────────────────────────────────────────────────

public class PrefixRequest
{
    public string PrefixName { get; set; } = string.Empty;
    public string? GenderApplicable { get; set; }
    public int SortOrder { get; set; }
}

public class PrefixResponse
{
    public Guid Id { get; set; }
    public string PrefixName { get; set; } = string.Empty;
    public string? GenderApplicable { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class PatientTypeRequest
{
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public int SortOrder { get; set; }
}

public class PatientTypeResponse
{
    public Guid Id { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class RegistrationTypeRequest
{
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ValidityDays { get; set; } = 365;
    public decimal RegistrationFee { get; set; }
    public int SortOrder { get; set; }
}

public class RegistrationTypeResponse
{
    public Guid Id { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ValidityDays { get; set; }
    public decimal RegistrationFee { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

// ── Queue ─────────────────────────────────────────────────────────────────────

public class AddToQueueRequest
{
    public Guid PatientId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string Priority { get; set; } = "Normal";
    public string? Notes { get; set; }
}

public class UpdateQueueStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? CancelReason { get; set; }
}

public class QueueResponse
{
    public Guid Id { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? DoctorName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime RegistrationTime { get; set; }
    public DateTime? CalledTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public int? WaitingMinutes { get; set; }
}

public class QueueStatsResponse
{
    public int WaitingCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }
    public int TotalCount { get; set; }
    public double AvgWaitingMinutes { get; set; }
}

// ── Renewal ───────────────────────────────────────────────────────────────────

public class RenewalSearchResponse
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string UHID { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public DateTime? ValidTill { get; set; }
    public string? RegistrationType { get; set; }
    public string? PatientType { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsExpired { get; set; }
    public decimal RenewalFee { get; set; }
    public DateTime? LastRenewalDate { get; set; }
    public int RenewalCount { get; set; }
}

public class RenewPatientRequest
{
    public Guid PatientId { get; set; }
    public int RenewalPeriodDays { get; set; } = 365;
    public decimal RenewalFee { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
}

public class RenewalResponse
{
    public Guid Id { get; set; }
    public string RenewalNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string UHID { get; set; } = string.Empty;
    public DateTime PreviousValidTill { get; set; }
    public DateTime NewValidTill { get; set; }
    public int RenewalPeriodDays { get; set; }
    public decimal FinalAmount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public DateTime RenewedAt { get; set; }
}

// ── Card Reprint ──────────────────────────────────────────────────────────────

public class CardReprintRequest
{
    public Guid PatientId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal Charges { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
}

public class CardReprintResponse
{
    public Guid Id { get; set; }
    public int ReprintNumber { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal Charges { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string ReprintedByName { get; set; } = string.Empty;
    public DateTime ReprintedAt { get; set; }
}

public class CardReprintSearchResponse
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string UHID { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public int ReprintCount { get; set; }
    public DateTime? LastReprintDate { get; set; }
    public List<CardReprintResponse> ReprintHistory { get; set; } = new();
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

public class AuditLogResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientUHID { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? FieldChanged { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Description { get; set; }
    public string? ChangedByName { get; set; }
    public string? ChangedByRole { get; set; }
    public string? IpAddress { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class AuditLogFilterRequest
{
    public string? SearchTerm { get; set; }
    public string? Action { get; set; }
    public Guid? PatientId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

// ── Export/Import ─────────────────────────────────────────────────────────────

public class ExportRequest
{
    public string? Status { get; set; }
    public string? PatientType { get; set; }
    public string? RegistrationType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string Format { get; set; } = "csv"; // csv, excel
}

public class ImportResultResponse
{
    public Guid JobId { get; set; }
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ImportErrorDetail> Errors { get; set; } = new();
}

public class ImportErrorDetail
{
    public int Row { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public string? RawData { get; set; }
}

// ── Walk-in ───────────────────────────────────────────────────────────────────

public class WalkInPatientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? MobileNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? ChiefComplaint { get; set; }
}

// ── Flexible Frontend-Compatible DTOs ─────────────────────────────────────────

public class PatientTypeFrontendRequest
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? TypeName { get; set; }
    public string? TypeCode { get; set; }
    public string? Description { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal DiscountPercent { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string? SpecialInstructions { get; set; }
}

public class RegistrationTypeFrontendRequest
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? TypeName { get; set; }
    public string? TypeCode { get; set; }
    public string? Description { get; set; }
    public string? RegCategory { get; set; }
    public int ValidityDays { get; set; } = 365;
    public decimal RegistrationFee { get; set; }
    public decimal RenewalFee { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public string? Color { get; set; }
    public List<object>? RegistrationParamInfoDetail { get; set; }
    public List<object>? RegistrationFeeDetail { get; set; }
}

// ── Patient Dashboard Stats ───────────────────────────────────────────────────

public class PatientDashboardStats
{
    public long TotalPatients { get; set; }
    public long TodayRegistrations { get; set; }
    public long ActivePatients { get; set; }
    public long InactivePatients { get; set; }
    public long MalePatients { get; set; }
    public long FemalePatients { get; set; }
    public double AvgAge { get; set; }
    public List<ChartDataPoint> GenderData { get; set; } = new();
    public List<ChartDataPoint> AgeGroupData { get; set; } = new();
    public List<ChartDataPoint> PatientTypeData { get; set; } = new();
    public List<ChartDataPoint> CityWiseData { get; set; } = new();
    public List<ChartDataPoint> MonthlyRegistrations { get; set; } = new();
    public List<ChartDataPoint> BloodGroupData { get; set; } = new();
}

public class ChartDataPoint
{
    public string Name { get; set; } = string.Empty;
    public long Count { get; set; }
    public string? Color { get; set; }
}
