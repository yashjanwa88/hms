using LaboratoryService.Domain;
using LaboratoryService.DTOs;
using LaboratoryService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace LaboratoryService.Application;

public interface ILaboratoryAppService
{
    Task<ApiResponse<LabTestResponse>> CreateLabTestAsync(CreateLabTestRequest request, Guid tenantId, string userId);
    Task<ApiResponse<List<LabTestResponse>>> GetLabTestsAsync(Guid tenantId);
    Task<ApiResponse<LabTestResponse>> GetLabTestByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<LabOrderResponse>> CreateLabOrderAsync(CreateLabOrderRequest request, Guid tenantId, string tenantCode, string userId);
    Task<ApiResponse<LabOrderResponse>> GetLabOrderByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<List<LabOrderResponse>>> GetLabOrdersByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<ApiResponse<LabOrderResponse>> CollectSampleAsync(Guid orderId, CollectSampleRequest request, Guid tenantId, string userId);
    Task<ApiResponse<LabOrderResponse>> CancelLabOrderAsync(Guid orderId, CancelLabOrderRequest request, Guid tenantId, string userId);
    Task<ApiResponse<LabOrderResponse>> EnterLabResultsAsync(Guid orderId, Guid itemId, EnterLabResultsRequest request, Guid tenantId, string userId);
    Task<ApiResponse<LabOrderResponse>> CompleteLabOrderAsync(Guid orderId, Guid tenantId, string userId);
    Task<ApiResponse<LabReportResponse>> GetLabReportAsync(Guid orderId, Guid tenantId);
}

public class LaboratoryAppService : ILaboratoryAppService
{
    private readonly ILabTestRepository _labTestRepo;
    private readonly ILabTestParameterRepository _parameterRepo;
    private readonly ILabOrderRepository _orderRepo;
    private readonly ILabOrderItemRepository _itemRepo;
    private readonly ILabResultRepository _resultRepo;
    private readonly IEventBus _eventBus;
    private readonly IDatabase _redis;
    private readonly ILogger<LaboratoryAppService> _logger;

    public LaboratoryAppService(
        ILabTestRepository labTestRepo,
        ILabTestParameterRepository parameterRepo,
        ILabOrderRepository orderRepo,
        ILabOrderItemRepository itemRepo,
        ILabResultRepository resultRepo,
        IEventBus eventBus,
        IConnectionMultiplexer redis,
        ILogger<LaboratoryAppService> logger)
    {
        _labTestRepo = labTestRepo;
        _parameterRepo = parameterRepo;
        _orderRepo = orderRepo;
        _itemRepo = itemRepo;
        _resultRepo = resultRepo;
        _eventBus = eventBus;
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<ApiResponse<LabTestResponse>> CreateLabTestAsync(CreateLabTestRequest request, Guid tenantId, string userId)
    {
        if (await _labTestRepo.TestCodeExistsAsync(request.TestCode, tenantId))
            return ApiResponse<LabTestResponse>.ErrorResponse("Test code already exists");

        var labTest = new LabTest
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TestCode = request.TestCode,
            TestName = request.TestName,
            Description = request.Description,
            Category = request.Category,
            Price = request.Price,
            TurnaroundTimeHours = request.TurnaroundTimeHours,
            SampleType = request.SampleType,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _labTestRepo.CreateAsync(labTest);

        foreach (var param in request.Parameters)
        {
            var parameter = new LabTestParameter
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                LabTestId = labTest.Id,
                ParameterName = param.ParameterName,
                Unit = param.Unit,
                ReferenceMin = param.ReferenceMin,
                ReferenceMax = param.ReferenceMax,
                CriticalMin = param.CriticalMin,
                CriticalMax = param.CriticalMax,
                ReferenceRange = param.ReferenceRange,
                DisplayOrder = param.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsDeleted = false
            };
            await _parameterRepo.CreateAsync(parameter);
        }

        await InvalidateLabTestsCacheAsync(tenantId);

        var response = await GetLabTestByIdAsync(labTest.Id, tenantId);
        _logger.LogInformation("Lab test created: {TestCode} for tenant {TenantId}", request.TestCode, tenantId);
        return response;
    }

    public async Task<ApiResponse<List<LabTestResponse>>> GetLabTestsAsync(Guid tenantId)
    {
        var cacheKey = $"lab:tests:{tenantId}";
        var cached = await _redis.StringGetAsync(cacheKey);
        
        if (cached.HasValue)
        {
            var cachedData = JsonSerializer.Deserialize<List<LabTestResponse>>(cached!);
            return ApiResponse<List<LabTestResponse>>.SuccessResponse(cachedData!);
        }

        var tests = await _labTestRepo.GetAllAsync(tenantId);
        var responses = new List<LabTestResponse>();

        foreach (var test in tests)
        {
            var parameters = await _parameterRepo.GetByLabTestIdAsync(test.Id, tenantId);
            responses.Add(new LabTestResponse
            {
                Id = test.Id,
                TestCode = test.TestCode,
                TestName = test.TestName,
                Description = test.Description,
                Category = test.Category,
                Price = test.Price,
                TurnaroundTimeHours = test.TurnaroundTimeHours,
                SampleType = test.SampleType,
                IsActive = test.IsActive,
                Parameters = parameters.Select(p => new LabTestParameterResponse
                {
                    Id = p.Id,
                    ParameterName = p.ParameterName,
                    Unit = p.Unit,
                    ReferenceMin = p.ReferenceMin,
                    ReferenceMax = p.ReferenceMax,
                    CriticalMin = p.CriticalMin,
                    CriticalMax = p.CriticalMax,
                    ReferenceRange = p.ReferenceRange,
                    DisplayOrder = p.DisplayOrder
                }).ToList()
            });
        }

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(responses), TimeSpan.FromMinutes(30));
        return ApiResponse<List<LabTestResponse>>.SuccessResponse(responses);
    }

    public async Task<ApiResponse<LabTestResponse>> GetLabTestByIdAsync(Guid id, Guid tenantId)
    {
        var test = await _labTestRepo.GetByIdAsync(id, tenantId);
        if (test == null)
            return ApiResponse<LabTestResponse>.ErrorResponse("Lab test not found");

        var parameters = await _parameterRepo.GetByLabTestIdAsync(test.Id, tenantId);
        var response = new LabTestResponse
        {
            Id = test.Id,
            TestCode = test.TestCode,
            TestName = test.TestName,
            Description = test.Description,
            Category = test.Category,
            Price = test.Price,
            TurnaroundTimeHours = test.TurnaroundTimeHours,
            SampleType = test.SampleType,
            IsActive = test.IsActive,
            Parameters = parameters.Select(p => new LabTestParameterResponse
            {
                Id = p.Id,
                ParameterName = p.ParameterName,
                Unit = p.Unit,
                ReferenceMin = p.ReferenceMin,
                ReferenceMax = p.ReferenceMax,
                CriticalMin = p.CriticalMin,
                CriticalMax = p.CriticalMax,
                ReferenceRange = p.ReferenceRange,
                DisplayOrder = p.DisplayOrder
            }).ToList()
        };

        return ApiResponse<LabTestResponse>.SuccessResponse(response);
    }

    public async Task<ApiResponse<LabOrderResponse>> CreateLabOrderAsync(CreateLabOrderRequest request, Guid tenantId, string tenantCode, string userId)
    {
        if (request.LabTestIds.Count == 0)
            return ApiResponse<LabOrderResponse>.ErrorResponse("At least one lab test is required");

        var orderNumber = await _orderRepo.GenerateOrderNumberAsync(tenantId, tenantCode);

        var order = new LabOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OrderNumber = orderNumber,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            DoctorId = request.DoctorId,
            OrderDate = DateTime.UtcNow,
            Status = "Pending",
            Priority = request.Priority,
            ClinicalNotes = request.ClinicalNotes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _orderRepo.CreateAsync(order);

        foreach (var testId in request.LabTestIds)
        {
            var item = new LabOrderItem
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                LabOrderId = order.Id,
                LabTestId = testId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsDeleted = false
            };
            await _itemRepo.CreateAsync(item);
        }

        _logger.LogInformation("Lab order created: {OrderNumber} for patient {PatientId}", orderNumber, request.PatientId);
        return await GetLabOrderByIdAsync(order.Id, tenantId);
    }

    public async Task<ApiResponse<LabOrderResponse>> GetLabOrderByIdAsync(Guid id, Guid tenantId)
    {
        var order = await _orderRepo.GetByIdAsync(id, tenantId);
        if (order == null)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order not found");

        var items = await _itemRepo.GetByOrderIdAsync(order.Id, tenantId);
        var itemResponses = new List<LabOrderItemResponse>();

        foreach (var item in items)
        {
            var test = await _labTestRepo.GetByIdAsync(item.LabTestId, tenantId);
            var results = await _resultRepo.GetByOrderItemIdAsync(item.Id, tenantId);
            var parameters = await _parameterRepo.GetByLabTestIdAsync(item.LabTestId, tenantId);

            var resultResponses = new List<LabResultResponse>();
            foreach (var result in results)
            {
                var param = parameters.FirstOrDefault(p => p.Id == result.LabTestParameterId);
                if (param != null)
                {
                    resultResponses.Add(new LabResultResponse
                    {
                        Id = result.Id,
                        LabTestParameterId = result.LabTestParameterId,
                        ParameterName = param.ParameterName,
                        Unit = param.Unit,
                        Value = result.Value,
                        IsAbnormal = result.IsAbnormal,
                        IsCritical = result.IsCritical,
                        Comments = result.Comments,
                        ReferenceMin = param.ReferenceMin,
                        ReferenceMax = param.ReferenceMax,
                        ReferenceRange = param.ReferenceRange
                    });
                }
            }

            itemResponses.Add(new LabOrderItemResponse
            {
                Id = item.Id,
                LabTestId = item.LabTestId,
                TestName = test?.TestName ?? "",
                Status = item.Status,
                ResultEnteredAt = item.ResultEnteredAt,
                ResultEnteredBy = item.ResultEnteredBy,
                Results = resultResponses
            });
        }

        var response = new LabOrderResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            PatientId = order.PatientId,
            EncounterId = order.EncounterId,
            DoctorId = order.DoctorId,
            OrderDate = order.OrderDate,
            Status = order.Status,
            Priority = order.Priority,
            SampleCollectedAt = order.SampleCollectedAt,
            SampleCollectedBy = order.SampleCollectedBy,
            CompletedAt = order.CompletedAt,
            CompletedBy = order.CompletedBy,
            ClinicalNotes = order.ClinicalNotes,
            CancellationReason = order.CancellationReason,
            Items = itemResponses
        };

        return ApiResponse<LabOrderResponse>.SuccessResponse(response);
    }

    public async Task<ApiResponse<List<LabOrderResponse>>> GetLabOrdersByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        var orders = await _orderRepo.GetByPatientIdAsync(patientId, tenantId);
        var responses = new List<LabOrderResponse>();

        foreach (var order in orders)
        {
            var result = await GetLabOrderByIdAsync(order.Id, tenantId);
            if (result.Success && result.Data != null)
                responses.Add(result.Data);
        }

        return ApiResponse<List<LabOrderResponse>>.SuccessResponse(responses);
    }

    public async Task<ApiResponse<LabOrderResponse>> CollectSampleAsync(Guid orderId, CollectSampleRequest request, Guid tenantId, string userId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, tenantId);
        if (order == null)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order not found");

        if (order.Status != "Pending")
            return ApiResponse<LabOrderResponse>.ErrorResponse("Sample can only be collected for pending orders");

        order.Status = "SampleCollected";
        order.SampleCollectedAt = DateTime.UtcNow;
        order.SampleCollectedBy = userId;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = userId;

        await _orderRepo.UpdateAsync(order);

        var items = await _itemRepo.GetByOrderIdAsync(orderId, tenantId);
        foreach (var item in items)
        {
            item.Status = "InProgress";
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedBy = userId;
            await _itemRepo.UpdateAsync(item);
        }

        _logger.LogInformation("Sample collected for order: {OrderNumber}", order.OrderNumber);
        return await GetLabOrderByIdAsync(orderId, tenantId);
    }

    public async Task<ApiResponse<LabOrderResponse>> CancelLabOrderAsync(Guid orderId, CancelLabOrderRequest request, Guid tenantId, string userId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, tenantId);
        if (order == null)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order not found");

        if (order.Status == "Completed" || order.Status == "Cancelled")
            return ApiResponse<LabOrderResponse>.ErrorResponse($"Cannot cancel order with status: {order.Status}");

        order.Status = "Cancelled";
        order.CancellationReason = request.CancellationReason;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = userId;

        await _orderRepo.UpdateAsync(order);

        _logger.LogInformation("Lab order cancelled: {OrderNumber}", order.OrderNumber);
        return await GetLabOrderByIdAsync(orderId, tenantId);
    }

    public async Task<ApiResponse<LabOrderResponse>> EnterLabResultsAsync(Guid orderId, Guid itemId, EnterLabResultsRequest request, Guid tenantId, string userId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, tenantId);
        if (order == null)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order not found");

        if (order.Status == "Cancelled")
            return ApiResponse<LabOrderResponse>.ErrorResponse("Cannot enter results for cancelled order");

        var item = await _itemRepo.GetByIdAsync(itemId, tenantId);
        if (item == null || item.LabOrderId != orderId)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order item not found");

        var parameters = await _parameterRepo.GetByLabTestIdAsync(item.LabTestId, tenantId);

        foreach (var resultEntry in request.Results)
        {
            var param = parameters.FirstOrDefault(p => p.Id == resultEntry.LabTestParameterId);
            if (param == null) continue;

            bool isAbnormal = false;
            bool isCritical = false;

            if (decimal.TryParse(resultEntry.Value, out var numericValue))
            {
                if (param.ReferenceMin.HasValue && numericValue < param.ReferenceMin.Value)
                    isAbnormal = true;
                if (param.ReferenceMax.HasValue && numericValue > param.ReferenceMax.Value)
                    isAbnormal = true;

                if (param.CriticalMin.HasValue && numericValue < param.CriticalMin.Value)
                    isCritical = true;
                if (param.CriticalMax.HasValue && numericValue > param.CriticalMax.Value)
                    isCritical = true;
            }

            var result = new LabResult
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                LabOrderItemId = item.Id,
                LabTestParameterId = resultEntry.LabTestParameterId,
                Value = resultEntry.Value,
                IsAbnormal = isAbnormal,
                IsCritical = isCritical,
                Comments = resultEntry.Comments,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsDeleted = false
            };

            await _resultRepo.CreateAsync(result);
        }

        item.Status = "Completed";
        item.ResultEnteredAt = DateTime.UtcNow;
        item.ResultEnteredBy = userId;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = userId;
        await _itemRepo.UpdateAsync(item);

        var allItems = await _itemRepo.GetByOrderIdAsync(orderId, tenantId);
        if (allItems.All(i => i.Status == "Completed"))
        {
            await CompleteLabOrderAsync(orderId, tenantId, userId);
        }

        _logger.LogInformation("Results entered for order item: {ItemId}", itemId);
        return await GetLabOrderByIdAsync(orderId, tenantId);
    }

    public async Task<ApiResponse<LabOrderResponse>> CompleteLabOrderAsync(Guid orderId, Guid tenantId, string userId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, tenantId);
        if (order == null)
            return ApiResponse<LabOrderResponse>.ErrorResponse("Lab order not found");

        if (order.Status == "Completed")
            return ApiResponse<LabOrderResponse>.ErrorResponse("Order already completed");

        var items = await _itemRepo.GetByOrderIdAsync(orderId, tenantId);
        if (items.Any(i => i.Status != "Completed"))
            return ApiResponse<LabOrderResponse>.ErrorResponse("All test items must be completed before completing the order");

        order.Status = "Completed";
        order.CompletedAt = DateTime.UtcNow;
        order.CompletedBy = userId;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = userId;

        await _orderRepo.UpdateAsync(order);

        var abnormalCount = await _resultRepo.CountAbnormalByOrderIdAsync(orderId, tenantId);
        var criticalCount = await _resultRepo.CountCriticalByOrderIdAsync(orderId, tenantId);

        var labOrderCompletedEvent = new LabOrderCompletedEvent
        {
            EventId = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            TenantId = tenantId,
            LabOrderId = order.Id,
            OrderNumber = order.OrderNumber,
            PatientId = order.PatientId,
            EncounterId = order.EncounterId,
            CompletedAt = order.CompletedAt.Value,
            TotalTests = items.Count,
            AbnormalResults = abnormalCount,
            CriticalResults = criticalCount
        };

        _eventBus.Publish(labOrderCompletedEvent);

        _logger.LogInformation("Lab order completed: {OrderNumber}", order.OrderNumber);
        return await GetLabOrderByIdAsync(orderId, tenantId);
    }

    public async Task<ApiResponse<LabReportResponse>> GetLabReportAsync(Guid orderId, Guid tenantId)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, tenantId);
        if (order == null)
            return ApiResponse<LabReportResponse>.ErrorResponse("Lab order not found");

        var items = await _itemRepo.GetByOrderIdAsync(orderId, tenantId);
        var testResponses = new List<LabReportTestResponse>();

        foreach (var item in items)
        {
            var test = await _labTestRepo.GetByIdAsync(item.LabTestId, tenantId);
            if (test == null) continue;

            var results = await _resultRepo.GetByOrderItemIdAsync(item.Id, tenantId);
            var parameters = await _parameterRepo.GetByLabTestIdAsync(item.LabTestId, tenantId);

            var parameterResponses = new List<LabReportParameterResponse>();
            foreach (var result in results)
            {
                var param = parameters.FirstOrDefault(p => p.Id == result.LabTestParameterId);
                if (param != null)
                {
                    parameterResponses.Add(new LabReportParameterResponse
                    {
                        ParameterName = param.ParameterName,
                        Value = result.Value,
                        Unit = param.Unit,
                        ReferenceRange = param.ReferenceRange ?? $"{param.ReferenceMin} - {param.ReferenceMax}",
                        IsAbnormal = result.IsAbnormal,
                        IsCritical = result.IsCritical,
                        Comments = result.Comments
                    });
                }
            }

            testResponses.Add(new LabReportTestResponse
            {
                TestName = test.TestName,
                SampleType = test.SampleType,
                Parameters = parameterResponses
            });
        }

        var report = new LabReportResponse
        {
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            Priority = order.Priority,
            CompletedAt = order.CompletedAt,
            PatientId = order.PatientId,
            DoctorId = order.DoctorId,
            ClinicalNotes = order.ClinicalNotes,
            Tests = testResponses
        };

        return ApiResponse<LabReportResponse>.SuccessResponse(report);
    }

    private async Task InvalidateLabTestsCacheAsync(Guid tenantId)
    {
        var cacheKey = $"lab:tests:{tenantId}";
        await _redis.KeyDeleteAsync(cacheKey);
    }
}
