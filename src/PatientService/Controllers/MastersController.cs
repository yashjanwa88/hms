using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientService.Domain;
using PatientService.DTOs;
using PatientService.Repositories;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace PatientService.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class MastersController : ControllerBase
{
    private readonly IMastersRepository _repo;
    private readonly IInsuranceProviderRepository _insuranceProviders;
    private readonly ILogger<MastersController> _logger;

    public MastersController(
        IMastersRepository repo,
        IInsuranceProviderRepository insuranceProviders,
        ILogger<MastersController> logger)
    {
        _repo = repo;
        _insuranceProviders = insuranceProviders;
        _logger = logger;
    }

    private Guid TenantId => Guid.Parse(Request.Headers["X-Tenant-Id"].ToString());
    private Guid UserId => Guid.Parse(Request.Headers["X-User-Id"].ToString());

    // ── Prefixes ──────────────────────────────────────────────────────────────

    [HttpGet("prefixes")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetPrefixes()
    {
        var result = await _repo.GetPrefixesAsync(TenantId);
        var response = result.Select(p => new PrefixResponse
        {
            Id = p.Id, PrefixName = p.PrefixName,
            GenderApplicable = p.GenderApplicable, IsActive = p.IsActive, SortOrder = p.SortOrder
        });
        return Ok(ApiResponse<IEnumerable<PrefixResponse>>.SuccessResponse(response, "Success"));
    }

    [HttpPost("prefixes")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> CreatePrefix([FromBody] PrefixRequest request)
    {
        var prefix = new PatientPrefix
        {
            TenantId = TenantId, PrefixName = request.PrefixName,
            GenderApplicable = request.GenderApplicable, SortOrder = request.SortOrder,
            IsActive = true, CreatedBy = UserId
        };
        var id = await _repo.CreatePrefixAsync(prefix);
        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Prefix created"));
    }

    [HttpPut("prefixes/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> UpdatePrefix(Guid id, [FromBody] PrefixRequest request)
    {
        var prefix = new PatientPrefix
        {
            Id = id, TenantId = TenantId, PrefixName = request.PrefixName,
            GenderApplicable = request.GenderApplicable, SortOrder = request.SortOrder, UpdatedBy = UserId
        };
        var result = await _repo.UpdatePrefixAsync(prefix);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Updated")) : NotFound();
    }

    [HttpPatch("prefixes/{id:guid}/toggle")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> TogglePrefix(Guid id)
    {
        var result = await _repo.TogglePrefixAsync(id, TenantId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Toggled")) : NotFound();
    }

    [HttpDelete("prefixes/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> DeletePrefix(Guid id)
    {
        var result = await _repo.TogglePrefixAsync(id, TenantId); // soft delete via toggle
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Deleted")) : NotFound();
    }

    // ── Patient Types ─────────────────────────────────────────────────────────

    [HttpGet("types")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetPatientTypes()
    {
        var result = await _repo.GetPatientTypesAsync(TenantId);
        // Map to frontend-expected field names (code, name, displayName)
        var response = result.Select(t => new
        {
            id = t.Id,
            code = t.TypeCode,
            name = t.TypeName,
            displayName = t.TypeName,
            description = t.Description,
            discountPercentage = t.DiscountPercent,
            isActive = t.IsActive,
            isDefault = false,
            sortOrder = t.SortOrder,
            color = "#3B82F6",
            icon = "user"
        });
        return Ok(ApiResponse<object>.SuccessResponse(response, "Success"));
    }

    [HttpPost("types")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> CreatePatientType([FromBody] PatientTypeFrontendRequest request)
    {
        var type = new PatientType
        {
            TenantId = TenantId,
            TypeName = request.Name ?? request.TypeName ?? string.Empty,
            TypeCode = request.Code ?? request.TypeCode ?? string.Empty,
            Description = request.Description,
            DiscountPercent = request.DiscountPercentage ?? request.DiscountPercent,
            SortOrder = request.SortOrder, IsActive = true, CreatedBy = UserId
        };
        var id = await _repo.CreatePatientTypeAsync(type);
        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Patient type created"));
    }

    [HttpPut("types/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> UpdatePatientType(Guid id, [FromBody] PatientTypeFrontendRequest request)
    {
        var type = new PatientType
        {
            Id = id, TenantId = TenantId,
            TypeName = request.Name ?? request.TypeName ?? string.Empty,
            TypeCode = request.Code ?? request.TypeCode ?? string.Empty,
            Description = request.Description,
            DiscountPercent = request.DiscountPercentage ?? request.DiscountPercent,
            SortOrder = request.SortOrder, UpdatedBy = UserId
        };
        var result = await _repo.UpdatePatientTypeAsync(type);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Updated")) : NotFound();
    }

    [HttpPatch("types/{id:guid}/toggle")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> TogglePatientType(Guid id)
    {
        var result = await _repo.TogglePatientTypeAsync(id, TenantId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Toggled")) : NotFound();
    }

    [HttpDelete("types/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> DeletePatientType(Guid id)
    {
        var result = await _repo.TogglePatientTypeAsync(id, TenantId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Deleted")) : NotFound();
    }

    // ── Registration Types ────────────────────────────────────────────────────

    [HttpGet("registration-types")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetRegistrationTypes()
    {
        var result = await _repo.GetRegistrationTypesAsync(TenantId);
        var response = result.Select(t => new
        {
            id = t.Id,
            code = t.TypeCode,
            name = t.TypeName,
            displayName = t.TypeName,
            description = t.Description,
            validityDays = t.ValidityDays,
            registrationFee = t.RegistrationFee,
            renewalFee = t.RegistrationFee,
            isActive = t.IsActive,
            isDefault = false,
            sortOrder = t.SortOrder,
            regCategory = "GEENRALCATEGORY",
            color = "#10B981",
            registrationParamInfoDetail = new object[] { },
            registrationFeeDetail = new object[] { },
            patientTypeDetail = new object[] { }
        });
        return Ok(ApiResponse<object>.SuccessResponse(response, "Success"));
    }

    [HttpPost("registration-types")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> CreateRegistrationType([FromBody] RegistrationTypeFrontendRequest request)
    {
        var type = new RegistrationType
        {
            TenantId = TenantId,
            TypeName = request.Name ?? request.TypeName ?? string.Empty,
            TypeCode = request.Code ?? request.TypeCode ?? string.Empty,
            Description = request.Description,
            ValidityDays = request.ValidityDays,
            RegistrationFee = request.RegistrationFee,
            SortOrder = request.SortOrder, IsActive = true, CreatedBy = UserId
        };
        var id = await _repo.CreateRegistrationTypeAsync(type);
        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Registration type created"));
    }

    [HttpPut("registration-types/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> UpdateRegistrationType(Guid id, [FromBody] RegistrationTypeFrontendRequest request)
    {
        var type = new RegistrationType
        {
            Id = id, TenantId = TenantId,
            TypeName = request.Name ?? request.TypeName ?? string.Empty,
            TypeCode = request.Code ?? request.TypeCode ?? string.Empty,
            Description = request.Description,
            ValidityDays = request.ValidityDays,
            RegistrationFee = request.RegistrationFee,
            SortOrder = request.SortOrder, UpdatedBy = UserId
        };
        var result = await _repo.UpdateRegistrationTypeAsync(type);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Updated")) : NotFound();
    }

    [HttpPatch("registration-types/{id:guid}/toggle")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> ToggleRegistrationType(Guid id)
    {
        var result = await _repo.ToggleRegistrationTypeAsync(id, TenantId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Toggled")) : NotFound();
    }

    [HttpDelete("registration-types/{id:guid}")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> DeleteRegistrationType(Guid id)
    {
        var result = await _repo.ToggleRegistrationTypeAsync(id, TenantId);
        return result ? Ok(ApiResponse<object>.SuccessResponse(null, "Deleted")) : NotFound();
    }

    // ── Insurance providers (master for patient registration) ─────────────────

    [HttpGet("insurance-providers")]
    [RequirePermission("patient.view")]
    public async Task<IActionResult> GetInsuranceProviders()
    {
        var list = await _insuranceProviders.GetActiveForListAsync(TenantId);
        var response = list.Select(p => new InsuranceProviderResponse
        {
            Id = p.Id,
            ProviderName = p.ProviderName,
            ProviderCode = p.ProviderCode,
            ContactNumber = p.ContactNumber,
            IsActive = p.IsActive
        });
        return Ok(ApiResponse<IEnumerable<InsuranceProviderResponse>>.SuccessResponse(response, "Success"));
    }

    // ── Seed Masters ──────────────────────────────────────────────────────────

    [HttpPost("masters/seed")]
    [RequirePermission("role.manage")]
    public async Task<IActionResult> SeedMasters()
    {
        using var conn = new Npgsql.NpgsqlConnection(
            HttpContext.RequestServices.GetRequiredService<IConfiguration>()
                .GetConnectionString("DefaultConnection"));
        await conn.OpenAsync();
        await Dapper.SqlMapper.ExecuteAsync(conn,
            "SELECT seed_patient_masters(@TenantId, @UserId)",
            new { TenantId, UserId });
        return Ok(ApiResponse<object>.SuccessResponse(null, "Masters seeded successfully"));
    }
}
