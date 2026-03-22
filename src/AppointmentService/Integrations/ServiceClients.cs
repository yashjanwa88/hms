using AppointmentService.DTOs;
using System.Net.Http.Headers;
using System.Text.Json;

namespace AppointmentService.Integrations;

public interface IDoctorServiceClient
{
    Task<DoctorDto?> GetDoctorAsync(Guid doctorId, Guid tenantId, string token);
    Task<List<DoctorAvailabilityDto>> GetDoctorAvailabilityAsync(Guid doctorId, Guid tenantId, string token);
    Task<List<DoctorDto>> SearchDoctorsAsync(string? specialization, Guid tenantId, string token);
}

public class DoctorServiceClient : IDoctorServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public DoctorServiceClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _baseUrl = configuration["Services:DoctorService"] ?? "http://localhost:5008";
    }

    public async Task<DoctorDto?> GetDoctorAsync(Guid doctorId, Guid tenantId, string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            var response = await _httpClient.GetAsync($"{_baseUrl}/api/doctor/v1/doctors/{doctorId}");
            
            if (!response.IsSuccessStatusCode)
                return null;

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponseWrapper<DoctorDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return apiResponse?.Data;
        }
        catch
        {
            return null;
        }
    }

    public async Task<List<DoctorAvailabilityDto>> GetDoctorAvailabilityAsync(Guid doctorId, Guid tenantId, string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            var response = await _httpClient.GetAsync($"{_baseUrl}/api/doctor/v1/doctors/{doctorId}/availability");
            
            if (!response.IsSuccessStatusCode)
                return new List<DoctorAvailabilityDto>();

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponseWrapper<List<DoctorAvailabilityDto>>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return apiResponse?.Data ?? new List<DoctorAvailabilityDto>();
        }
        catch
        {
            return new List<DoctorAvailabilityDto>();
        }
    }

    public async Task<List<DoctorDto>> SearchDoctorsAsync(string? specialization, Guid tenantId, string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            var url = $"{_baseUrl}/api/doctor/v1/doctors/search?status=Active";
            if (!string.IsNullOrEmpty(specialization))
                url += $"&specialization={Uri.EscapeDataString(specialization)}";

            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
                return new List<DoctorDto>();

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponseWrapper<List<DoctorDto>>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return apiResponse?.Data ?? new List<DoctorDto>();
        }
        catch
        {
            return new List<DoctorDto>();
        }
    }
}

public interface IPatientServiceClient
{
    Task<PatientDto?> GetPatientAsync(Guid patientId, Guid tenantId, string token);
}

public class PatientServiceClient : IPatientServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public PatientServiceClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _baseUrl = configuration["Services:PatientService"] ?? "http://localhost:5003";
    }

    public async Task<PatientDto?> GetPatientAsync(Guid patientId, Guid tenantId, string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            var response = await _httpClient.GetAsync($"{_baseUrl}/api/patient/v1/patients/{patientId}");
            
            if (!response.IsSuccessStatusCode)
                return null;

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponseWrapper<PatientDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return apiResponse?.Data;
        }
        catch
        {
            return null;
        }
    }
}

public class ApiResponseWrapper<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}
