using Shared.Common.Models;

namespace IPDService.Domain;

public class Ward : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // General, ICU, NICU, VIP
    public int FloorNumber { get; set; }
    public decimal BasePricePerDay { get; set; }
}

public class Bed : BaseEntity
{
    public Guid WardId { get; set; }
    public string BedNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Available, Occupied, Maintenance
}

public class Admission : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid PrimaryDoctorId { get; set; }
    public Guid WardId { get; set; }
    public Guid BedId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public DateTime AdmissionDate { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string ReasonForAdmission { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Admitted, Discharged
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
}
