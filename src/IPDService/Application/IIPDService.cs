using IPDService.Domain;
using IPDService.DTOs;

namespace IPDService.Application;

public interface IIPDService
{
    Task<Ward> CreateWardAsync(CreateWardRequest request, Guid tenantId, Guid userId);
    Task<IEnumerable<Ward>> GetAllWardsAsync(Guid tenantId);
    
    Task<Bed> CreateBedAsync(CreateBedRequest request, Guid tenantId, Guid userId);
    Task<IEnumerable<Bed>> GetBedsByWardAsync(Guid tenantId, Guid wardId);
    
    Task<Admission> AdmitPatientAsync(AdmitPatientRequest request, Guid tenantId, Guid userId);
    Task<Admission> DischargePatientAsync(Guid admissionId, DischargePatientRequest request, Guid tenantId, Guid userId);
    Task<IEnumerable<Admission>> GetActiveAdmissionsAsync(Guid tenantId);
}
