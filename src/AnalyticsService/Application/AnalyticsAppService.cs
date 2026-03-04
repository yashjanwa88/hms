using AnalyticsService.DTOs;
using AnalyticsService.Repositories;
using StackExchange.Redis;
using System.Text.Json;

namespace AnalyticsService.Application;

public interface IAnalyticsService
{
    Task<List<RevenueResponse>> GetDailyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<List<RevenueResponse>> GetMonthlyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<List<RevenueResponse>> GetYearlyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<List<DoctorPerformanceResponse>> GetDoctorPerformanceAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<List<InsuranceSummaryResponse>> GetInsuranceSummaryAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<List<InsuranceApprovalRateResponse>> GetInsuranceApprovalRateAsync(Guid tenantId);
    Task<List<PatientSummaryResponse>> GetPatientSummaryAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId);
    Task<DashboardResponse> GetDashboardAsync(Guid tenantId);
}

public class AnalyticsAppService : IAnalyticsService
{
    private readonly IRevenueSummaryRepository _revenueRepository;
    private readonly IDoctorPerformanceRepository _doctorRepository;
    private readonly IInsuranceSummaryRepository _insuranceRepository;
    private readonly IPatientSummaryRepository _patientRepository;
    private readonly IDatabase? _cache;
    private readonly ILogger<AnalyticsAppService> _logger;

    public AnalyticsAppService(
        IRevenueSummaryRepository revenueRepository,
        IDoctorPerformanceRepository doctorRepository,
        IInsuranceSummaryRepository insuranceRepository,
        IPatientSummaryRepository patientRepository,
        ILogger<AnalyticsAppService> logger,
        IConnectionMultiplexer? redis = null)
    {
        _revenueRepository = revenueRepository;
        _doctorRepository = doctorRepository;
        _insuranceRepository = insuranceRepository;
        _patientRepository = patientRepository;
        _logger = logger;
        _cache = redis?.GetDatabase();
    }

    public async Task<List<RevenueResponse>> GetDailyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _revenueRepository.GetDailyRevenueAsync(from, to, tenantId);
        return data.Select(r => new RevenueResponse
        {
            Date = r.Date,
            TotalRevenue = r.TotalRevenue,
            PaidAmount = r.PaidAmount,
            RefundAmount = r.RefundAmount,
            InvoiceCount = r.InvoiceCount,
            PaymentCount = r.PaymentCount,
            Period = r.Period
        }).ToList();
    }

    public async Task<List<RevenueResponse>> GetMonthlyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddMonths(-12);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _revenueRepository.GetMonthlyRevenueAsync(from, to, tenantId);
        return data.Select(r => new RevenueResponse
        {
            Date = r.Date,
            TotalRevenue = r.TotalRevenue,
            PaidAmount = r.PaidAmount,
            RefundAmount = r.RefundAmount,
            InvoiceCount = r.InvoiceCount,
            PaymentCount = r.PaymentCount,
            Period = r.Period
        }).ToList();
    }

    public async Task<List<RevenueResponse>> GetYearlyRevenueAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddYears(-5);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _revenueRepository.GetYearlyRevenueAsync(from, to, tenantId);
        return data.Select(r => new RevenueResponse
        {
            Date = r.Date,
            TotalRevenue = r.TotalRevenue,
            PaidAmount = r.PaidAmount,
            RefundAmount = r.RefundAmount,
            InvoiceCount = r.InvoiceCount,
            PaymentCount = r.PaymentCount,
            Period = r.Period
        }).ToList();
    }

    public async Task<List<DoctorPerformanceResponse>> GetDoctorPerformanceAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _doctorRepository.GetPerformanceAsync(from, to, tenantId);
        return data.Select(d => new DoctorPerformanceResponse
        {
            DoctorId = d.DoctorId,
            DoctorName = d.DoctorName,
            Date = d.Date,
            EncounterCount = d.EncounterCount,
            PatientCount = d.PatientCount,
            TotalRevenue = d.TotalRevenue,
            AverageRevenuePerEncounter = d.AverageRevenuePerEncounter
        }).ToList();
    }

    public async Task<List<InsuranceSummaryResponse>> GetInsuranceSummaryAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _insuranceRepository.GetSummaryAsync(from, to, tenantId);
        return data.Select(i => new InsuranceSummaryResponse
        {
            ProviderId = i.ProviderId,
            ProviderName = i.ProviderName,
            Date = i.Date,
            TotalClaims = i.TotalClaims,
            ApprovedClaims = i.ApprovedClaims,
            RejectedClaims = i.RejectedClaims,
            SettledClaims = i.SettledClaims,
            TotalClaimAmount = i.TotalClaimAmount,
            ApprovedAmount = i.ApprovedAmount,
            SettledAmount = i.SettledAmount,
            ApprovalRate = i.ApprovalRate
        }).ToList();
    }

    public async Task<List<InsuranceApprovalRateResponse>> GetInsuranceApprovalRateAsync(Guid tenantId)
    {
        var data = await _insuranceRepository.GetApprovalRatesAsync(tenantId);
        return data.Select(i => new InsuranceApprovalRateResponse
        {
            ProviderId = i.ProviderId,
            ProviderName = i.ProviderName,
            ApprovalRate = i.ApprovalRate,
            TotalClaims = i.TotalClaims,
            ApprovedClaims = i.ApprovedClaims
        }).ToList();
    }

    public async Task<List<PatientSummaryResponse>> GetPatientSummaryAsync(DateTime? fromDate, DateTime? toDate, Guid tenantId)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var data = await _patientRepository.GetSummaryAsync(from, to, tenantId);
        return data.Select(p => new PatientSummaryResponse
        {
            Date = p.Date,
            NewPatients = p.NewPatients,
            TotalEncounters = p.TotalEncounters,
            TotalAppointments = p.TotalAppointments,
            AverageRevenuePerPatient = p.AverageRevenuePerPatient
        }).ToList();
    }

    public async Task<DashboardResponse> GetDashboardAsync(Guid tenantId)
    {
        var cacheKey = $"dashboard:{tenantId}";
        
        if (_cache != null)
        {
            var cached = await _cache.StringGetAsync(cacheKey);
            if (!cached.IsNullOrEmpty)
                return JsonSerializer.Deserialize<DashboardResponse>(cached!) ?? new DashboardResponse();
        }

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var yearStart = new DateTime(today.Year, 1, 1);

        var dailyRevenue = await _revenueRepository.GetDailyRevenueAsync(today, today, tenantId);
        var monthRevenue = await _revenueRepository.GetDailyRevenueAsync(monthStart, today, tenantId);
        var yearRevenue = await _revenueRepository.GetDailyRevenueAsync(yearStart, today, tenantId);

        var dailyPatients = await _patientRepository.GetSummaryAsync(today, today, tenantId);
        var monthPatients = await _patientRepository.GetSummaryAsync(monthStart, today, tenantId);
        var yearPatients = await _patientRepository.GetSummaryAsync(yearStart, today, tenantId);

        var insuranceData = await _insuranceRepository.GetApprovalRatesAsync(tenantId);

        var response = new DashboardResponse
        {
            Revenue = new RevenueMetrics
            {
                TodayRevenue = dailyRevenue.Sum(r => r.TotalRevenue),
                MonthRevenue = monthRevenue.Sum(r => r.TotalRevenue),
                YearRevenue = yearRevenue.Sum(r => r.TotalRevenue),
                GrowthRate = CalculateGrowthRate(monthRevenue)
            },
            Encounters = new EncounterMetrics
            {
                TodayCount = dailyPatients.Sum(p => p.TotalEncounters),
                MonthCount = monthPatients.Sum(p => p.TotalEncounters),
                YearCount = yearPatients.Sum(p => p.TotalEncounters)
            },
            Insurance = new InsuranceMetrics
            {
                TotalClaims = insuranceData.Sum(i => i.TotalClaims),
                ApprovedClaims = insuranceData.Sum(i => i.ApprovedClaims),
                ApprovalRate = insuranceData.Any() ? insuranceData.Average(i => i.ApprovalRate) : 0,
                TotalClaimAmount = insuranceData.Sum(i => i.TotalClaimAmount)
            },
            Patients = new PatientMetrics
            {
                TodayNew = dailyPatients.Sum(p => p.NewPatients),
                MonthNew = monthPatients.Sum(p => p.NewPatients),
                YearNew = yearPatients.Sum(p => p.NewPatients),
                TotalActive = yearPatients.Sum(p => p.NewPatients)
            }
        };

        if (_cache != null)
            await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(response), TimeSpan.FromMinutes(10));

        return response;
    }

    private decimal CalculateGrowthRate(List<Domain.RevenueSummary> data)
    {
        if (data.Count < 2) return 0;

        var sorted = data.OrderBy(r => r.Date).ToList();
        var firstHalf = sorted.Take(sorted.Count / 2).Sum(r => r.TotalRevenue);
        var secondHalf = sorted.Skip(sorted.Count / 2).Sum(r => r.TotalRevenue);

        if (firstHalf == 0) return 0;
        return ((secondHalf - firstHalf) / firstHalf) * 100;
    }
}
