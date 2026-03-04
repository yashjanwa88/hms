using TenantService.Domain;
using TenantService.DTOs;
using TenantService.Repositories;

namespace TenantService.Application;

public interface ITenantService
{
    Task<Tenant> CreateTenantAsync(CreateTenantRequest request);
    Task<Tenant?> GetTenantByIdAsync(Guid id);
    Task<bool> UpdateTenantAsync(Guid id, UpdateTenantRequest request, Guid updatedBy);
    Task<IEnumerable<Tenant>> GetAllTenantsAsync();
}

public class TenantAppService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;

    public TenantAppService(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<Tenant> CreateTenantAsync(CreateTenantRequest request)
    {
        var existingTenant = await _tenantRepository.GetByEmailAsync(request.Email);
        if (existingTenant != null)
        {
            throw new Exception("Tenant with this email already exists");
        }

        var tenant = new Tenant
        {
            HospitalName = request.HospitalName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            IsActive = true,
            SubscriptionStartDate = DateTime.UtcNow,
            SubscriptionEndDate = DateTime.UtcNow.AddYears(1),
            SubscriptionPlan = request.SubscriptionPlan
        };

        await _tenantRepository.CreateAsync(tenant);
        return tenant;
    }

    public async Task<Tenant?> GetTenantByIdAsync(Guid id)
    {
        return await _tenantRepository.GetByIdAsync(id);
    }

    public async Task<bool> UpdateTenantAsync(Guid id, UpdateTenantRequest request, Guid updatedBy)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null)
        {
            throw new Exception("Tenant not found");
        }

        tenant.HospitalName = request.HospitalName;
        tenant.PhoneNumber = request.PhoneNumber;
        tenant.Address = request.Address;
        tenant.City = request.City;
        tenant.State = request.State;
        tenant.Country = request.Country;
        tenant.PostalCode = request.PostalCode;
        tenant.UpdatedBy = updatedBy;

        return await _tenantRepository.UpdateAsync(tenant);
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync()
    {
        return await _tenantRepository.GetAllAsync();
    }
}
