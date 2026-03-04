using EncounterService.Domain;
using EncounterService.DTOs;
using EncounterService.Repositories;
using Shared.Common.Models;

namespace EncounterService.Application;

public interface IEncounterAppService
{
    Task<Guid> CreateEncounterAsync(CreateEncounterRequest request, Guid tenantId, Guid createdBy, string tenantCode);
    Task<Encounter?> GetEncounterByIdAsync(Guid id, Guid tenantId);
    Task<Encounter?> GetEncounterByNumberAsync(string encounterNumber, Guid tenantId);
    Task<bool> UpdateEncounterStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy);
    Task<PagedResult<Encounter>> SearchEncountersAsync(EncounterSearchRequest request, Guid tenantId);
    Task<EncounterCountResponse> GetCountByPatientAsync(Guid patientId, Guid tenantId);
}

public class EncounterAppService : IEncounterAppService
{
    private readonly IEncounterRepository _encounterRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EncounterAppService> _logger;

    public EncounterAppService(
        IEncounterRepository encounterRepository,
        IHttpClientFactory httpClientFactory,
        ILogger<EncounterAppService> logger)
    {
        _encounterRepository = encounterRepository;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<Guid> CreateEncounterAsync(CreateEncounterRequest request, Guid tenantId, Guid createdBy, string tenantCode)
    {
        // Validate patient exists
        var patientExists = await ValidatePatientExistsAsync(request.PatientId, tenantId);
        if (!patientExists)
        {
            throw new Exception("Patient not found");
        }

        // Generate encounter number
        var encounterNumber = await _encounterRepository.GenerateEncounterNumberAsync(tenantId, tenantCode);

        // Create encounter
        var encounter = new Encounter
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            EncounterNumber = encounterNumber,
            VisitType = request.VisitType,
            Department = request.Department,
            ChiefComplaint = request.ChiefComplaint,
            CreatedBy = createdBy
        };

        var encounterId = await _encounterRepository.CreateAsync(encounter);

        // Auto-create invoice (fire and forget)
        _ = Task.Run(async () =>
        {
            try
            {
                await CreateInvoiceForEncounterAsync(encounterId, request.PatientId, tenantId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create invoice for encounter {EncounterId}", encounterId);
            }
        });

        // Increment patient visit count (fire and forget - non-blocking)
        _ = Task.Run(async () =>
        {
            try
            {
                await IncrementPatientVisitCountAsync(request.PatientId, tenantId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to increment visit count for patient {PatientId}", request.PatientId);
            }
        });

        return encounterId;
    }

    public async Task<Encounter?> GetEncounterByIdAsync(Guid id, Guid tenantId)
    {
        return await _encounterRepository.GetByIdAsync(id, tenantId);
    }

    public async Task<Encounter?> GetEncounterByNumberAsync(string encounterNumber, Guid tenantId)
    {
        return await _encounterRepository.GetByNumberAsync(encounterNumber, tenantId);
    }

    public async Task<bool> UpdateEncounterStatusAsync(Guid id, string status, Guid tenantId, Guid updatedBy)
    {
        // Validate status
        if (status != "Completed" && status != "Cancelled")
        {
            throw new Exception("Invalid status. Only 'Completed' or 'Cancelled' allowed");
        }

        // Check if encounter exists and is active
        var encounter = await _encounterRepository.GetByIdAsync(id, tenantId);
        if (encounter == null)
        {
            throw new Exception("Encounter not found");
        }

        if (encounter.Status != "Active")
        {
            throw new Exception("Only active encounters can be updated");
        }

        return await _encounterRepository.UpdateStatusAsync(id, status, tenantId, updatedBy);
    }

    public async Task<PagedResult<Encounter>> SearchEncountersAsync(EncounterSearchRequest request, Guid tenantId)
    {
        return await _encounterRepository.SearchAsync(request, tenantId);
    }

    public async Task<EncounterCountResponse> GetCountByPatientAsync(Guid patientId, Guid tenantId)
    {
        return await _encounterRepository.GetCountByPatientAsync(patientId, tenantId);
    }

    private async Task CreateInvoiceForEncounterAsync(Guid encounterId, Guid patientId, Guid tenantId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            client.DefaultRequestHeaders.Add("X-User-Id", Guid.Empty.ToString());
            
            var invoiceData = new
            {
                patientId,
                encounterId,
                tax = 0,
                discount = 0
            };
            
            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(invoiceData),
                System.Text.Encoding.UTF8,
                "application/json"
            );
            
            await client.PostAsync("http://localhost:5010/api/billing/invoices", content);
            _logger.LogInformation("Auto-created invoice for encounter {EncounterId}", encounterId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to auto-create invoice for encounter {EncounterId}", encounterId);
        }
    }

    private async Task<bool> ValidatePatientExistsAsync(Guid patientId, Guid tenantId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            var response = await client.GetAsync($"http://localhost:5003/api/patients/{patientId}");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate patient {PatientId}", patientId);
            return false;
        }
    }

    private async Task IncrementPatientVisitCountAsync(Guid patientId, Guid tenantId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            await client.PostAsync($"http://localhost:5003/api/patients/{patientId}/increment-visit", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to increment visit count for patient {PatientId}", patientId);
        }
    }
}
