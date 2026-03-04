using InsuranceService.DTOs;
using Shared.Common.Models;
using System.Net.Http.Headers;
using System.Text.Json;

namespace InsuranceService.Integrations;

public interface IPatientServiceClient
{
    Task<PatientDto?> GetPatientAsync(Guid patientId, Guid tenantId, string token);
}

public class PatientServiceClient : IPatientServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PatientServiceClient> _logger;

    public PatientServiceClient(HttpClient httpClient, ILogger<PatientServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PatientDto?> GetPatientAsync(Guid patientId, Guid tenantId, string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            var response = await _httpClient.GetAsync($"/api/patients/{patientId}");
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<PatientDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Patient Service");
            return null;
        }
    }
}
