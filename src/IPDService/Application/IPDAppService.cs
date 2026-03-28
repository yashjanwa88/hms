using IPDService.Domain;
using IPDService.DTOs;
using IPDService.Repositories;

namespace IPDService.Application;

public class IPDAppService : IIPDService
{
    private readonly IWardRepository _wardRepository;
    private readonly IBedRepository _bedRepository;
    private readonly IAdmissionRepository _admissionRepository;

    public IPDAppService(
        IWardRepository wardRepository,
        IBedRepository bedRepository,
        IAdmissionRepository admissionRepository)
    {
        _wardRepository = wardRepository;
        _bedRepository = bedRepository;
        _admissionRepository = admissionRepository;
    }

    public async Task<Ward> CreateWardAsync(CreateWardRequest request, Guid tenantId, Guid userId)
    {
        var ward = new Ward
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = request.Name,
            Type = request.Type,
            FloorNumber = request.FloorNumber,
            BasePricePerDay = request.BasePricePerDay,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _wardRepository.CreateAsync(ward);
        return ward;
    }

    public async Task<IEnumerable<Ward>> GetAllWardsAsync(Guid tenantId)
    {
        return await _wardRepository.GetAllWardsAsync(tenantId);
    }

    public async Task<Bed> CreateBedAsync(CreateBedRequest request, Guid tenantId, Guid userId)
    {
        var bed = new Bed
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            WardId = request.WardId,
            BedNumber = request.BedNumber,
            Status = "Available",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _bedRepository.CreateAsync(bed);
        return bed;
    }

    public async Task<IEnumerable<Bed>> GetBedsByWardAsync(Guid tenantId, Guid wardId)
    {
        return await _bedRepository.GetBedsByWardIdAsync(tenantId, wardId);
    }

    public async Task<Admission> AdmitPatientAsync(AdmitPatientRequest request, Guid tenantId, Guid userId)
    {
        var existingAdmission = await _admissionRepository.GetActiveAdmissionForPatientAsync(tenantId, request.PatientId);
        if (existingAdmission != null)
        {
            throw new Exception("Patient is already admitted.");
        }

        var bed = await _bedRepository.GetByIdAsync(request.BedId, tenantId);
        if (bed == null || bed.Status != "Available")
        {
            throw new Exception("Selected bed is not available.");
        }

        var admission = new Admission
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = request.PatientId,
            PrimaryDoctorId = request.PrimaryDoctorId,
            WardId = request.WardId,
            BedId = request.BedId,
            AdmissionNumber = $"ADM-{DateTime.UtcNow:yyyyMMddHHmmss}",
            AdmissionDate = DateTime.UtcNow,
            ReasonForAdmission = request.ReasonForAdmission,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            Status = "Admitted",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _admissionRepository.CreateAsync(admission);

        bed.Status = "Occupied";
        bed.UpdatedAt = DateTime.UtcNow;
        bed.UpdatedBy = userId;
        await _bedRepository.UpdateAsync(bed);

        return admission;
    }

    public async Task<Admission> DischargePatientAsync(Guid admissionId, DischargePatientRequest request, Guid tenantId, Guid userId)
    {
        var admission = await _admissionRepository.GetByIdAsync(admissionId, tenantId);
        if (admission == null || admission.Status != "Admitted")
        {
            throw new Exception("Admission not found or patient already discharged.");
        }

        admission.Status = "Discharged";
        admission.DischargeDate = DateTime.UtcNow;
        admission.UpdatedAt = DateTime.UtcNow;
        admission.UpdatedBy = userId;
        await _admissionRepository.UpdateAsync(admission);

        var bed = await _bedRepository.GetByIdAsync(admission.BedId, tenantId);
        if (bed != null)
        {
            bed.Status = "Available";
            bed.UpdatedAt = DateTime.UtcNow;
            bed.UpdatedBy = userId;
            await _bedRepository.UpdateAsync(bed);
        }

        return admission;
    }

    public async Task<IEnumerable<Admission>> GetActiveAdmissionsAsync(Guid tenantId)
    {
        return await _admissionRepository.GetActiveAdmissionsAsync(tenantId);
    }
}
