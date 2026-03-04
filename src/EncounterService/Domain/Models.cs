using Shared.Common.Models;

namespace EncounterService.Domain;

public class Encounter : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string EncounterNumber { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty; // OPD, IPD, Emergency
    public string? Department { get; set; }
    public string? ChiefComplaint { get; set; }
    public string Status { get; set; } = "Active"; // Active, Completed, Cancelled
    public DateTime EncounterDate { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class EncounterSequence : BaseEntity
{
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
}
