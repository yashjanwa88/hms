namespace IPDService.DTOs;

public class CreateWardRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int FloorNumber { get; set; }
    public decimal BasePricePerDay { get; set; }
}

public class CreateBedRequest
{
    public Guid WardId { get; set; }
    public string BedNumber { get; set; } = string.Empty;
}

public class AdmitPatientRequest
{
    public Guid PatientId { get; set; }
    public Guid PrimaryDoctorId { get; set; }
    public Guid WardId { get; set; }
    public Guid BedId { get; set; }
    public string ReasonForAdmission { get; set; } = string.Empty;
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
}

public class DischargePatientRequest
{
    public string DischargeSummary { get; set; } = string.Empty;
}
