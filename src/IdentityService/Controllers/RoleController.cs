using IdentityService.Application;
using IdentityService.Domain;
using IdentityService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Models;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/identity/v1/roles")]
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RoleController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Role>>> CreateRole(
        [FromBody] CreateRoleRequest request,
        [FromHeader(Name = "X-Tenant-Id")] Guid tenantId,
        [FromHeader(Name = "X-User-Id")] Guid userId)
    {
        try
        {
            var result = await _roleService.CreateRoleAsync(request, tenantId, userId);
            return Ok(ApiResponse<Role>.SuccessResponse(result, "Role created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Role>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Role>>>> GetAllRoles([FromHeader(Name = "X-Tenant-Id")] Guid tenantId)
    {
        try
        {
            var result = await _roleService.GetAllRolesAsync(tenantId);
            return Ok(ApiResponse<IEnumerable<Role>>.SuccessResponse(result, "Roles retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Role>>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{roleId}/permissions")]
    public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetRolePermissions(Guid roleId)
    {
        try
        {
            var permissions = await _roleService.GetRolePermissionsAsync(roleId);
            return Ok(ApiResponse<IEnumerable<string>>.SuccessResponse(permissions, "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<string>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{roleId}/permissions")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateRolePermissions(Guid roleId, [FromBody] UpdateRolePermissionsRequest request)
    {
        try
        {
            await _roleService.UpdateRolePermissionsAsync(roleId, request.PermissionIds);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Permissions updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }
}

[ApiController]
[Route("api/identity/v1/permissions")]
public class PermissionController : ControllerBase
{
    private readonly IRoleService _roleService;

    public PermissionController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Permission>>>> GetAllPermissions()
    {
        try
        {
            var permissions = await _roleService.GetAllPermissionsAsync();
            return Ok(ApiResponse<IEnumerable<Permission>>.SuccessResponse(permissions, "Success"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<IEnumerable<Permission>>.ErrorResponse(ex.Message));
        }
    }
}
