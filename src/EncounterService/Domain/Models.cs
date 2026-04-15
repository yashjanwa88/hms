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

public class Vitals : BaseEntity
{
    public Guid EncounterId { get; set; }
    public Guid PatientId { get; set; }
    public decimal? Temperature { get; set; } // Celsius
    public int? PulseRate { get; set; } // bpm
    public int? RespiratoryRate { get; set; } // breaths/min
    public string? BloodPressure { get; set; } // 120/80
    public decimal? SpO2 { get; set; } // Oxygen Saturation %
    public decimal? Weight { get; set; } // kg
    public decimal? Height { get; set; } // cm
    public decimal? BMI => (Weight.HasValue && Height.HasValue && Height > 0) ? Weight / ((Height / 100) * (Height / 100)) : null;
    public string? PainScale { get; set; } // 0-10
    public string? ConsciousnessLevel { get; set; } // GCS, etc.
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public Guid RecordedBy { get; set; } // Nurse ID
}

public class EncounterSequence : BaseEntity
{
    public string TenantCode { get; set; } = string.Empty;
    public int Year { get; set; }
    public int LastSequence { get; set; }
}
