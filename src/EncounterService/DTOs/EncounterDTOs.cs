namespace EncounterService.DTOs;

public class CreateEncounterRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string VisitType { get; set; } = string.Empty; // OPD, IPD, Emergency
    public string? Department { get; set; }
    public string? ChiefComplaint { get; set; }
}

public class UpdateEncounterStatusRequest
{
    public string Status { get; set; } = string.Empty; // Completed, Cancelled
}

public class EncounterSearchRequest
{
    public Guid? PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public string? VisitType { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "encounter_date";
    public string SortOrder { get; set; } = "desc";
}

public class EncounterResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string EncounterNumber { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? ChiefComplaint { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime EncounterDate { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class EncounterCountResponse
{
    public int TotalEncounters { get; set; }
    public int ActiveEncounters { get; set; }
    public int CompletedEncounters { get; set; }
}
