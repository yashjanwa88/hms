using IdentityService.Domain;
using IdentityService.Repositories;

namespace IdentityService.Application;

public interface IPermissionService
{
    Task<List<Permission>> GetAllPermissionsAsync();
    Task<Permission?> GetPermissionByIdAsync(Guid permissionId);
    Task<List<Permission>> GetPermissionsByModuleAsync(string module);
    Task<List<Permission>> GetUserPermissionsAsync(Guid userId);
    Task<List<Permission>> GetRolePermissionsAsync(Guid roleId);
    Task<Permission> CreatePermissionAsync(string code, string name, string description, string module);
    Task<Permission> UpdatePermissionAsync(Guid permissionId, string name, string description, string module);
    Task<bool> DeletePermissionAsync(Guid permissionId);
    Task<bool> AssignPermissionToRoleAsync(Guid roleId, Guid permissionId, Guid? assignedBy);
    Task<bool> RemovePermissionFromRoleAsync(Guid roleId, Guid permissionId);
    Task<bool> BulkAssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds, Guid? assignedBy);
    Task<bool> UserHasPermissionAsync(Guid userId, string permissionCode);
}

public class PermissionService : IPermissionService
{
    private readonly IPermissionRepository _permissionRepository;

    public PermissionService(IPermissionRepository permissionRepository)
    {
        _permissionRepository = permissionRepository;
    }

    public async Task<List<Permission>> GetAllPermissionsAsync()
    {
        return await _permissionRepository.GetAllPermissionsAsync();
    }

    public async Task<Permission?> GetPermissionByIdAsync(Guid permissionId)
    {
        return await _permissionRepository.GetPermissionByIdAsync(permissionId);
    }

    public async Task<List<Permission>> GetPermissionsByModuleAsync(string module)
    {
        return await _permissionRepository.GetPermissionsByModuleAsync(module);
    }

    public async Task<List<Permission>> GetUserPermissionsAsync(Guid userId)
    {
        return await _permissionRepository.GetUserPermissionsAsync(userId);
    }

    public async Task<List<Permission>> GetRolePermissionsAsync(Guid roleId)
    {
        return await _permissionRepository.GetRolePermissionsAsync(roleId);
    }

    public async Task<Permission> CreatePermissionAsync(string code, string name, string description, string module)
    {
        var permission = new Permission
        {
            Code = code,
            Name = name,
            Description = description,
            Module = module
        };

        return await _permissionRepository.CreatePermissionAsync(permission);
    }

    public async Task<Permission> UpdatePermissionAsync(Guid permissionId, string name, string description, string module)
    {
        var existing = await _permissionRepository.GetPermissionByIdAsync(permissionId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Permission with ID {permissionId} not found");
        }

        existing.Name = name;
        existing.Description = description;
        existing.Module = module;

        return await _permissionRepository.UpdatePermissionAsync(existing);
    }

    public async Task<bool> DeletePermissionAsync(Guid permissionId)
    {
        return await _permissionRepository.DeletePermissionAsync(permissionId);
    }

    public async Task<bool> AssignPermissionToRoleAsync(Guid roleId, Guid permissionId, Guid? assignedBy)
    {
        return await _permissionRepository.AssignPermissionToRoleAsync(roleId, permissionId, assignedBy);
    }

    public async Task<bool> RemovePermissionFromRoleAsync(Guid roleId, Guid permissionId)
    {
        return await _permissionRepository.RemovePermissionFromRoleAsync(roleId, permissionId);
    }

    public async Task<bool> BulkAssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds, Guid? assignedBy)
    {
        return await _permissionRepository.BulkAssignPermissionsToRoleAsync(roleId, permissionIds, assignedBy);
    }

    public async Task<bool> UserHasPermissionAsync(Guid userId, string permissionCode)
    {
        return await _permissionRepository.HasPermissionAsync(userId, permissionCode);
    }
}
