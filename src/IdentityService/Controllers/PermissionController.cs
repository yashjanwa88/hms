using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IdentityService.Application;
using IdentityService.DTOs;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/identity/v1/permissions")]
[Authorize]
public class PermissionController : IdentityControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly ILogger<PermissionController> _logger;

    public PermissionController(
        IPermissionService permissionService,
        ILogger<PermissionController> logger)
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all permissions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PermissionResponse>>>> GetAllPermissions()
    {
        try
        {
            var permissions = await _permissionService.GetAllPermissionsAsync();
            
            var response = permissions.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Success(response, "Permissions retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving permissions");
            return Error<List<PermissionResponse>>("Failed to retrieve permissions");
        }
    }

    /// <summary>
    /// Get permission by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PermissionResponse>>> GetPermissionById(Guid id)
    {
        try
        {
            var permission = await _permissionService.GetPermissionByIdAsync(id);
            
            if (permission == null)
            {
                return NotFound(Error<PermissionResponse>("Permission not found"));
            }

            var response = new PermissionResponse
            {
                Id = permission.Id,
                Code = permission.Code,
                Name = permission.Name,
                Description = permission.Description,
                Module = permission.Module,
                CreatedAt = permission.CreatedAt
            };

            return Success(response, "Permission retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving permission {PermissionId}", id);
            return Error<PermissionResponse>("Failed to retrieve permission");
        }
    }

    /// <summary>
    /// Get permissions by module
    /// </summary>
    [HttpGet("module/{module}")]
    public async Task<ActionResult<ApiResponse<List<PermissionResponse>>>> GetPermissionsByModule(string module)
    {
        try
        {
            var permissions = await _permissionService.GetPermissionsByModuleAsync(module);
            
            var response = permissions.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Success(response, $"Permissions for module {module} retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving permissions for module {Module}", module);
            return Error<List<PermissionResponse>>("Failed to retrieve permissions");
        }
    }

    /// <summary>
    /// Get user permissions
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<PermissionResponse>>>> GetUserPermissions(Guid userId)
    {
        try
        {
            var permissions = await _permissionService.GetUserPermissionsAsync(userId);
            
            var response = permissions.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Success(response, "User permissions retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving permissions for user {UserId}", userId);
            return Error<List<PermissionResponse>>("Failed to retrieve user permissions");
        }
    }

    /// <summary>
    /// Get role permissions
    /// </summary>
    [HttpGet("role/{roleId}")]
    public async Task<ActionResult<ApiResponse<List<PermissionResponse>>>> GetRolePermissions(Guid roleId)
    {
        try
        {
            var permissions = await _permissionService.GetRolePermissionsAsync(roleId);
            
            var response = permissions.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Success(response, "Role permissions retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving permissions for role {RoleId}", roleId);
            return Error<List<PermissionResponse>>("Failed to retrieve role permissions");
        }
    }

    /// <summary>
    /// Create a new permission
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PermissionResponse>>> CreatePermission([FromBody] CreatePermissionRequest request)
    {
        try
        {
            var permission = await _permissionService.CreatePermissionAsync(
                request.Code,
                request.Name,
                request.Description,
                request.Module
            );

            var response = new PermissionResponse
            {
                Id = permission.Id,
                Code = permission.Code,
                Name = permission.Name,
                Description = permission.Description,
                Module = permission.Module,
                CreatedAt = permission.CreatedAt
            };

            return Success(response, "Permission created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating permission");
            return Error<PermissionResponse>("Failed to create permission");
        }
    }

    /// <summary>
    /// Update a permission
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PermissionResponse>>> UpdatePermission(Guid id, [FromBody] UpdatePermissionRequest request)
    {
        try
        {
            var permission = await _permissionService.UpdatePermissionAsync(
                id,
                request.Name,
                request.Description,
                request.Module
            );

            var response = new PermissionResponse
            {
                Id = permission.Id,
                Code = permission.Code,
                Name = permission.Name,
                Description = permission.Description,
                Module = permission.Module,
                CreatedAt = permission.CreatedAt
            };

            return Success(response, "Permission updated successfully");
        }
        catch (KeyNotFoundException)
        {
            return NotFound(Error<PermissionResponse>("Permission not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating permission {PermissionId}", id);
            return Error<PermissionResponse>("Failed to update permission");
        }
    }

    /// <summary>
    /// Delete a permission
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePermission(Guid id)
    {
        try
        {
            var result = await _permissionService.DeletePermissionAsync(id);
            
            if (!result)
            {
                return NotFound(Error<bool>("Permission not found"));
            }

            return Success(true, "Permission deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting permission {PermissionId}", id);
            return Error<bool>("Failed to delete permission");
        }
    }

    /// <summary>
    /// Assign permission to role
    /// </summary>
    [HttpPost("role/{roleId}")]
    public async Task<ActionResult<ApiResponse<bool>>> AssignPermissionToRole(Guid roleId, [FromBody] AssignPermissionRequest request)
    {
        try
        {
            var assignedBy = GetUserId();
            var result = await _permissionService.AssignPermissionToRoleAsync(roleId, request.PermissionId, assignedBy);
            
            if (!result)
            {
                return BadRequest(Error<bool>("Failed to assign permission to role"));
            }

            return Success(true, "Permission assigned to role successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning permission {PermissionId} to role {RoleId}", request.PermissionId, roleId);
            return Error<bool>("Failed to assign permission to role");
        }
    }

    /// <summary>
    /// Remove permission from role
    /// </summary>
    [HttpDelete("role/{roleId}/{permissionId}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemovePermissionFromRole(Guid roleId, Guid permissionId)
    {
        try
        {
            var result = await _permissionService.RemovePermissionFromRoleAsync(roleId, permissionId);
            
            if (!result)
            {
                return NotFound(Error<bool>("Permission or role not found"));
            }

            return Success(true, "Permission removed from role successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing permission {PermissionId} from role {RoleId}", permissionId, roleId);
            return Error<bool>("Failed to remove permission from role");
        }
    }

    /// <summary>
    /// Bulk assign permissions to role (replaces existing permissions)
    /// </summary>
    [HttpPut("role/{roleId}/bulk")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkAssignPermissionsToRole(Guid roleId, [FromBody] BulkAssignPermissionsRequest request)
    {
        try
        {
            var assignedBy = GetUserId();
            var result = await _permissionService.BulkAssignPermissionsToRoleAsync(roleId, request.PermissionIds, assignedBy);
            
            if (!result)
            {
                return BadRequest(Error<bool>("Failed to assign permissions to role"));
            }

            return Success(true, $"{request.PermissionIds.Count} permissions assigned to role successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk assigning permissions to role {RoleId}", roleId);
            return Error<bool>("Failed to assign permissions to role");
        }
    }
}
