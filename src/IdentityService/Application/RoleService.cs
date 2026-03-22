using IdentityService.Domain;
using IdentityService.DTOs;
using IdentityService.Repositories;

namespace IdentityService.Application;

public interface IRoleService
{
    Task<Role> CreateRoleAsync(CreateRoleRequest request, Guid tenantId, Guid createdBy);
    Task<IEnumerable<Role>> GetAllRolesAsync(Guid tenantId);
    Task<IEnumerable<Permission>> GetAllPermissionsAsync();
    /// <summary>Permission ids for the role; <paramref name="tenantId"/> must own the role.</summary>
    Task<IEnumerable<string>> GetRolePermissionsAsync(Guid roleId, Guid tenantId);
    Task UpdateRolePermissionsAsync(Guid roleId, Guid tenantId, List<string> permissionIds);
}

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<Role> CreateRoleAsync(CreateRoleRequest request, Guid tenantId, Guid createdBy)
    {
        var existingRole = await _roleRepository.GetByNameAsync(request.Name, tenantId);
        if (existingRole != null)
        {
            throw new Exception("Role with this name already exists");
        }

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description,
            TenantId = tenantId,
            CreatedBy = createdBy
        };

        await _roleRepository.CreateAsync(role);
        return role;
    }

    public async Task<IEnumerable<Role>> GetAllRolesAsync(Guid tenantId)
    {
        return await _roleRepository.GetAllAsync(tenantId);
    }

    public async Task<IEnumerable<Permission>> GetAllPermissionsAsync()
    {
        return await _roleRepository.GetAllPermissionsAsync();
    }

    public async Task<IEnumerable<string>> GetRolePermissionsAsync(Guid roleId, Guid tenantId)
    {
        var role = await _roleRepository.GetByIdAsync(roleId, tenantId);
        if (role == null)
            throw new InvalidOperationException("Role not found for this tenant.");
        return await _roleRepository.GetRolePermissionsAsync(roleId);
    }

    public async Task UpdateRolePermissionsAsync(Guid roleId, Guid tenantId, List<string> permissionIds)
    {
        var role = await _roleRepository.GetByIdAsync(roleId, tenantId);
        if (role == null)
            throw new InvalidOperationException("Role not found for this tenant.");
        await _roleRepository.UpdateRolePermissionsAsync(roleId, permissionIds);
    }
}
