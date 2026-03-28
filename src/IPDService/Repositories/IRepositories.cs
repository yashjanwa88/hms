using IPDService.Domain;
using Shared.Common.Interfaces;

namespace IPDService.Repositories;

public interface IWardRepository : IBaseRepository<Ward>
{
    Task<IEnumerable<Ward>> GetAllWardsAsync(Guid tenantId);
}

public interface IBedRepository : IBaseRepository<Bed>
{
    Task<IEnumerable<Bed>> GetBedsByWardIdAsync(Guid tenantId, Guid wardId);
}

public interface IAdmissionRepository : IBaseRepository<Admission>
{
    Task<IEnumerable<Admission>> GetActiveAdmissionsAsync(Guid tenantId);
    Task<Admission?> GetActiveAdmissionForPatientAsync(Guid tenantId, Guid patientId);
}
