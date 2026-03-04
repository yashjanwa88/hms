using PharmacyService.Domain;
using PharmacyService.DTOs;
using PharmacyService.Repositories;
using Shared.Common.Models;
using Shared.EventBus.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace PharmacyService.Application;

public interface IPharmacyAppService
{
    Task<ApiResponse<DrugResponse>> CreateDrugAsync(CreateDrugRequest request, Guid tenantId, string userId);
    Task<ApiResponse<List<DrugResponse>>> GetDrugsAsync(Guid tenantId);
    Task<ApiResponse<DrugResponse>> GetDrugByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<DrugResponse>> UpdateDrugAsync(Guid id, UpdateDrugRequest request, Guid tenantId, string userId);
    Task<ApiResponse<DrugBatchResponse>> CreateBatchAsync(CreateBatchRequest request, Guid tenantId, string userId);
    Task<ApiResponse<List<DrugBatchResponse>>> GetBatchesByDrugIdAsync(Guid drugId, Guid tenantId);
    Task<ApiResponse<PrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request, Guid tenantId, string tenantCode, string userId);
    Task<ApiResponse<PrescriptionResponse>> GetPrescriptionByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<List<PrescriptionResponse>>> GetPrescriptionsByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<ApiResponse<PrescriptionResponse>> VerifyPrescriptionAsync(Guid id, Guid tenantId, string userId);
    Task<ApiResponse<PrescriptionResponse>> CancelPrescriptionAsync(Guid id, CancelPrescriptionRequest request, Guid tenantId, string userId);
    Task<ApiResponse<PrescriptionResponse>> DispensePrescriptionAsync(Guid id, Guid tenantId, string userId);
    Task<ApiResponse<PrescriptionReceiptResponse>> GetPrescriptionReceiptAsync(Guid id, Guid tenantId);
    Task<ApiResponse<DailySalesReportResponse>> GetDailySalesReportAsync(DateTime date, Guid tenantId);
    Task<ApiResponse<LowStockReportResponse>> GetLowStockReportAsync(Guid tenantId);
}

public class PharmacyAppService : IPharmacyAppService
{
    private readonly IDrugRepository _drugRepo;
    private readonly IDrugBatchRepository _batchRepo;
    private readonly IPrescriptionRepository _prescriptionRepo;
    private readonly IPrescriptionItemRepository _itemRepo;
    private readonly IDispenseLogRepository _dispenseLogRepo;
    private readonly IEventBus _eventBus;
    private readonly IDatabase _redis;
    private readonly ILogger<PharmacyAppService> _logger;

    public PharmacyAppService(
        IDrugRepository drugRepo,
        IDrugBatchRepository batchRepo,
        IPrescriptionRepository prescriptionRepo,
        IPrescriptionItemRepository itemRepo,
        IDispenseLogRepository dispenseLogRepo,
        IEventBus eventBus,
        IConnectionMultiplexer redis,
        ILogger<PharmacyAppService> logger)
    {
        _drugRepo = drugRepo;
        _batchRepo = batchRepo;
        _prescriptionRepo = prescriptionRepo;
        _itemRepo = itemRepo;
        _dispenseLogRepo = dispenseLogRepo;
        _eventBus = eventBus;
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<ApiResponse<DrugResponse>> CreateDrugAsync(CreateDrugRequest request, Guid tenantId, string userId)
    {
        if (await _drugRepo.DrugCodeExistsAsync(request.DrugCode, tenantId))
            return ApiResponse<DrugResponse>.ErrorResponse("Drug code already exists");

        var drug = new Drug
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            DrugCode = request.DrugCode,
            DrugName = request.DrugName,
            GenericName = request.GenericName,
            Category = request.Category,
            Manufacturer = request.Manufacturer,
            Strength = request.Strength,
            DosageForm = request.DosageForm,
            UnitPrice = request.UnitPrice,
            ReorderLevel = request.ReorderLevel,
            IsControlled = request.IsControlled,
            RequiresPrescription = request.RequiresPrescription,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _drugRepo.CreateAsync(drug);
        await InvalidateDrugsCacheAsync(tenantId);

        _logger.LogInformation("Drug created: {DrugCode} for tenant {TenantId}", request.DrugCode, tenantId);
        return await GetDrugByIdAsync(drug.Id, tenantId);
    }

    public async Task<ApiResponse<List<DrugResponse>>> GetDrugsAsync(Guid tenantId)
    {
        var cacheKey = $"pharmacy:drugs:{tenantId}";
        var cached = await _redis.StringGetAsync(cacheKey);
        
        if (cached.HasValue)
        {
            var cachedData = JsonSerializer.Deserialize<List<DrugResponse>>(cached!);
            return ApiResponse<List<DrugResponse>>.SuccessResponse(cachedData!);
        }

        var drugs = await _drugRepo.GetAllAsync(tenantId);
        var responses = new List<DrugResponse>();

        foreach (var drug in drugs)
        {
            var stock = await _drugRepo.GetAvailableStockAsync(drug.Id, tenantId);
            responses.Add(new DrugResponse
            {
                Id = drug.Id,
                DrugCode = drug.DrugCode,
                DrugName = drug.DrugName,
                GenericName = drug.GenericName,
                Category = drug.Category,
                Manufacturer = drug.Manufacturer,
                Strength = drug.Strength,
                DosageForm = drug.DosageForm,
                UnitPrice = drug.UnitPrice,
                ReorderLevel = drug.ReorderLevel,
                AvailableStock = stock,
                IsControlled = drug.IsControlled,
                RequiresPrescription = drug.RequiresPrescription,
                IsActive = drug.IsActive
            });
        }

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(responses), TimeSpan.FromMinutes(30));
        return ApiResponse<List<DrugResponse>>.SuccessResponse(responses);
    }

    public async Task<ApiResponse<DrugResponse>> GetDrugByIdAsync(Guid id, Guid tenantId)
    {
        var drug = await _drugRepo.GetByIdAsync(id, tenantId);
        if (drug == null)
            return ApiResponse<DrugResponse>.ErrorResponse("Drug not found");

        var stock = await _drugRepo.GetAvailableStockAsync(drug.Id, tenantId);
        var response = new DrugResponse
        {
            Id = drug.Id,
            DrugCode = drug.DrugCode,
            DrugName = drug.DrugName,
            GenericName = drug.GenericName,
            Category = drug.Category,
            Manufacturer = drug.Manufacturer,
            Strength = drug.Strength,
            DosageForm = drug.DosageForm,
            UnitPrice = drug.UnitPrice,
            ReorderLevel = drug.ReorderLevel,
            AvailableStock = stock,
            IsControlled = drug.IsControlled,
            RequiresPrescription = drug.RequiresPrescription,
            IsActive = drug.IsActive
        };

        return ApiResponse<DrugResponse>.SuccessResponse(response);
    }

    public async Task<ApiResponse<DrugResponse>> UpdateDrugAsync(Guid id, UpdateDrugRequest request, Guid tenantId, string userId)
    {
        var drug = await _drugRepo.GetByIdAsync(id, tenantId);
        if (drug == null)
            return ApiResponse<DrugResponse>.ErrorResponse("Drug not found");

        drug.DrugName = request.DrugName;
        drug.GenericName = request.GenericName;
        drug.Category = request.Category;
        drug.Manufacturer = request.Manufacturer;
        drug.Strength = request.Strength;
        drug.DosageForm = request.DosageForm;
        drug.UnitPrice = request.UnitPrice;
        drug.ReorderLevel = request.ReorderLevel;
        drug.IsControlled = request.IsControlled;
        drug.RequiresPrescription = request.RequiresPrescription;
        drug.IsActive = request.IsActive;
        drug.UpdatedAt = DateTime.UtcNow;
        drug.UpdatedBy = userId;

        await _drugRepo.UpdateAsync(drug);
        await InvalidateDrugsCacheAsync(tenantId);

        _logger.LogInformation("Drug updated: {DrugId}", id);
        return await GetDrugByIdAsync(id, tenantId);
    }

    public async Task<ApiResponse<DrugBatchResponse>> CreateBatchAsync(CreateBatchRequest request, Guid tenantId, string userId)
    {
        var drug = await _drugRepo.GetByIdAsync(request.DrugId, tenantId);
        if (drug == null)
            return ApiResponse<DrugBatchResponse>.ErrorResponse("Drug not found");

        if (request.ExpiryDate <= DateTime.UtcNow)
            return ApiResponse<DrugBatchResponse>.ErrorResponse("Expiry date must be in the future");

        var batch = new DrugBatch
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            DrugId = request.DrugId,
            BatchNumber = request.BatchNumber,
            ManufactureDate = request.ManufactureDate,
            ExpiryDate = request.ExpiryDate,
            Quantity = request.Quantity,
            CostPrice = request.CostPrice,
            SellingPrice = request.SellingPrice,
            Supplier = request.Supplier,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _batchRepo.CreateAsync(batch);
        await InvalidateDrugsCacheAsync(tenantId);

        _logger.LogInformation("Batch created: {BatchNumber} for drug {DrugId}", request.BatchNumber, request.DrugId);

        var response = new DrugBatchResponse
        {
            Id = batch.Id,
            DrugId = batch.DrugId,
            BatchNumber = batch.BatchNumber,
            ManufactureDate = batch.ManufactureDate,
            ExpiryDate = batch.ExpiryDate,
            Quantity = batch.Quantity,
            CostPrice = batch.CostPrice,
            SellingPrice = batch.SellingPrice,
            Supplier = batch.Supplier,
            IsExpired = batch.ExpiryDate <= DateTime.UtcNow
        };

        return ApiResponse<DrugBatchResponse>.SuccessResponse(response);
    }

    public async Task<ApiResponse<List<DrugBatchResponse>>> GetBatchesByDrugIdAsync(Guid drugId, Guid tenantId)
    {
        var batches = await _batchRepo.GetByDrugIdAsync(drugId, tenantId);
        var responses = batches.Select(b => new DrugBatchResponse
        {
            Id = b.Id,
            DrugId = b.DrugId,
            BatchNumber = b.BatchNumber,
            ManufactureDate = b.ManufactureDate,
            ExpiryDate = b.ExpiryDate,
            Quantity = b.Quantity,
            CostPrice = b.CostPrice,
            SellingPrice = b.SellingPrice,
            Supplier = b.Supplier,
            IsExpired = b.ExpiryDate <= DateTime.UtcNow
        }).ToList();

        return ApiResponse<List<DrugBatchResponse>>.SuccessResponse(responses);
    }

    public async Task<ApiResponse<PrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request, Guid tenantId, string tenantCode, string userId)
    {
        if (request.Items.Count == 0)
            return ApiResponse<PrescriptionResponse>.ErrorResponse("At least one item is required");

        var prescriptionNumber = await _prescriptionRepo.GeneratePrescriptionNumberAsync(tenantId, tenantCode);

        decimal totalAmount = 0;
        foreach (var item in request.Items)
        {
            var drug = await _drugRepo.GetByIdAsync(item.DrugId, tenantId);
            if (drug == null)
                return ApiResponse<PrescriptionResponse>.ErrorResponse($"Drug not found: {item.DrugId}");
            
            totalAmount += drug.UnitPrice * item.Quantity;
        }

        var prescription = new Prescription
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PrescriptionNumber = prescriptionNumber,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            DoctorId = request.DoctorId,
            PrescriptionDate = DateTime.UtcNow,
            Status = "Pending",
            TotalAmount = totalAmount,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _prescriptionRepo.CreateAsync(prescription);

        foreach (var itemReq in request.Items)
        {
            var drug = await _drugRepo.GetByIdAsync(itemReq.DrugId, tenantId);
            var item = new PrescriptionItem
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PrescriptionId = prescription.Id,
                DrugId = itemReq.DrugId,
                Quantity = itemReq.Quantity,
                Dosage = itemReq.Dosage,
                Frequency = itemReq.Frequency,
                Duration = itemReq.Duration,
                Instructions = itemReq.Instructions,
                UnitPrice = drug!.UnitPrice,
                Amount = drug.UnitPrice * itemReq.Quantity,
                IsDispensed = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsDeleted = false
            };
            await _itemRepo.CreateAsync(item);
        }

        _logger.LogInformation("Prescription created: {PrescriptionNumber}", prescriptionNumber);
        return await GetPrescriptionByIdAsync(prescription.Id, tenantId);
    }

    public async Task<ApiResponse<PrescriptionResponse>> GetPrescriptionByIdAsync(Guid id, Guid tenantId)
    {
        var prescription = await _prescriptionRepo.GetByIdAsync(id, tenantId);
        if (prescription == null)
            return ApiResponse<PrescriptionResponse>.ErrorResponse("Prescription not found");

        var items = await _itemRepo.GetByPrescriptionIdAsync(prescription.Id, tenantId);
        var itemResponses = new List<PrescriptionItemResponse>();

        foreach (var item in items)
        {
            var drug = await _drugRepo.GetByIdAsync(item.DrugId, tenantId);
            itemResponses.Add(new PrescriptionItemResponse
            {
                Id = item.Id,
                DrugId = item.DrugId,
                DrugName = drug?.DrugName ?? "",
                Strength = drug?.Strength ?? "",
                Quantity = item.Quantity,
                Dosage = item.Dosage,
                Frequency = item.Frequency,
                Duration = item.Duration,
                Instructions = item.Instructions,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount,
                IsDispensed = item.IsDispensed
            });
        }

        var response = new PrescriptionResponse
        {
            Id = prescription.Id,
            PrescriptionNumber = prescription.PrescriptionNumber,
            PatientId = prescription.PatientId,
            EncounterId = prescription.EncounterId,
            DoctorId = prescription.DoctorId,
            PrescriptionDate = prescription.PrescriptionDate,
            Status = prescription.Status,
            VerifiedAt = prescription.VerifiedAt,
            VerifiedBy = prescription.VerifiedBy,
            DispensedAt = prescription.DispensedAt,
            DispensedBy = prescription.DispensedBy,
            TotalAmount = prescription.TotalAmount,
            Notes = prescription.Notes,
            CancellationReason = prescription.CancellationReason,
            Items = itemResponses
        };

        return ApiResponse<PrescriptionResponse>.SuccessResponse(response);
    }

    public async Task<ApiResponse<List<PrescriptionResponse>>> GetPrescriptionsByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        var prescriptions = await _prescriptionRepo.GetByPatientIdAsync(patientId, tenantId);
        var responses = new List<PrescriptionResponse>();

        foreach (var prescription in prescriptions)
        {
            var result = await GetPrescriptionByIdAsync(prescription.Id, tenantId);
            if (result.Success && result.Data != null)
                responses.Add(result.Data);
        }

        return ApiResponse<List<PrescriptionResponse>>.SuccessResponse(responses);
    }

    public async Task<ApiResponse<PrescriptionResponse>> VerifyPrescriptionAsync(Guid id, Guid tenantId, string userId)
    {
        var prescription = await _prescriptionRepo.GetByIdAsync(id, tenantId);
        if (prescription == null)
            return ApiResponse<PrescriptionResponse>.ErrorResponse("Prescription not found");

        if (prescription.Status != "Pending")
            return ApiResponse<PrescriptionResponse>.ErrorResponse($"Cannot verify prescription with status: {prescription.Status}");

        prescription.Status = "Verified";
        prescription.VerifiedAt = DateTime.UtcNow;
        prescription.VerifiedBy = userId;
        prescription.UpdatedAt = DateTime.UtcNow;
        prescription.UpdatedBy = userId;

        await _prescriptionRepo.UpdateAsync(prescription);

        _logger.LogInformation("Prescription verified: {PrescriptionNumber}", prescription.PrescriptionNumber);
        return await GetPrescriptionByIdAsync(id, tenantId);
    }

    public async Task<ApiResponse<PrescriptionResponse>> CancelPrescriptionAsync(Guid id, CancelPrescriptionRequest request, Guid tenantId, string userId)
    {
        var prescription = await _prescriptionRepo.GetByIdAsync(id, tenantId);
        if (prescription == null)
            return ApiResponse<PrescriptionResponse>.ErrorResponse("Prescription not found");

        if (prescription.Status == "Dispensed" || prescription.Status == "Cancelled")
            return ApiResponse<PrescriptionResponse>.ErrorResponse($"Cannot cancel prescription with status: {prescription.Status}");

        prescription.Status = "Cancelled";
        prescription.CancellationReason = request.CancellationReason;
        prescription.UpdatedAt = DateTime.UtcNow;
        prescription.UpdatedBy = userId;

        await _prescriptionRepo.UpdateAsync(prescription);

        _logger.LogInformation("Prescription cancelled: {PrescriptionNumber}", prescription.PrescriptionNumber);
        return await GetPrescriptionByIdAsync(id, tenantId);
    }

    public async Task<ApiResponse<PrescriptionResponse>> DispensePrescriptionAsync(Guid id, Guid tenantId, string userId)
    {
        var prescription = await _prescriptionRepo.GetByIdAsync(id, tenantId);
        if (prescription == null)
            return ApiResponse<PrescriptionResponse>.ErrorResponse("Prescription not found");

        if (prescription.Status == "Cancelled")
            return ApiResponse<PrescriptionResponse>.ErrorResponse("Cannot dispense cancelled prescription");

        var items = await _itemRepo.GetByPrescriptionIdAsync(prescription.Id, tenantId);

        foreach (var item in items)
        {
            var drug = await _drugRepo.GetByIdAsync(item.DrugId, tenantId);
            if (drug == null)
                return ApiResponse<PrescriptionResponse>.ErrorResponse($"Drug not found: {item.DrugId}");

            var availableStock = await _drugRepo.GetAvailableStockAsync(item.DrugId, tenantId);
            if (availableStock < item.Quantity)
                return ApiResponse<PrescriptionResponse>.ErrorResponse($"Insufficient stock for {drug.DrugName}. Available: {availableStock}, Required: {item.Quantity}");

            var batches = await _batchRepo.GetFEFOBatchesAsync(item.DrugId, tenantId, item.Quantity);
            if (batches.Count == 0)
                return ApiResponse<PrescriptionResponse>.ErrorResponse($"No valid batches found for {drug.DrugName}");

            int remainingQty = item.Quantity;
            foreach (var batch in batches)
            {
                if (remainingQty <= 0) break;

                int dispenseQty = Math.Min(batch.Quantity, remainingQty);
                
                await _batchRepo.UpdateQuantityAsync(batch.Id, batch.Quantity - dispenseQty, tenantId);

                var dispenseLog = new DispenseLog
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    PrescriptionItemId = item.Id,
                    DrugBatchId = batch.Id,
                    QuantityDispensed = dispenseQty,
                    DispensedAt = DateTime.UtcNow,
                    DispensedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    IsDeleted = false
                };
                await _dispenseLogRepo.CreateAsync(dispenseLog);

                remainingQty -= dispenseQty;
            }

            item.IsDispensed = true;
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedBy = userId;
            await _itemRepo.UpdateAsync(item);

            var newStock = await _drugRepo.GetAvailableStockAsync(item.DrugId, tenantId);
            if (newStock < drug.ReorderLevel)
            {
                var lowStockEvent = new LowStockEvent
                {
                    EventId = Guid.NewGuid(),
                    OccurredAt = DateTime.UtcNow,
                    TenantId = tenantId,
                    DrugId = drug.Id,
                    DrugCode = drug.DrugCode,
                    DrugName = drug.DrugName,
                    AvailableStock = newStock,
                    ReorderLevel = drug.ReorderLevel
                };
                _eventBus.Publish(lowStockEvent);
            }
        }

        prescription.Status = "Dispensed";
        prescription.DispensedAt = DateTime.UtcNow;
        prescription.DispensedBy = userId;
        prescription.UpdatedAt = DateTime.UtcNow;
        prescription.UpdatedBy = userId;

        await _prescriptionRepo.UpdateAsync(prescription);
        await InvalidateDrugsCacheAsync(tenantId);

        var prescriptionDispensedEvent = new PrescriptionDispensedEvent
        {
            EventId = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            TenantId = tenantId,
            PrescriptionId = prescription.Id,
            PrescriptionNumber = prescription.PrescriptionNumber,
            PatientId = prescription.PatientId,
            EncounterId = prescription.EncounterId,
            DispensedAt = prescription.DispensedAt.Value,
            TotalAmount = prescription.TotalAmount,
            TotalItems = items.Count
        };
        _eventBus.Publish(prescriptionDispensedEvent);

        _logger.LogInformation("Prescription dispensed: {PrescriptionNumber}", prescription.PrescriptionNumber);
        return await GetPrescriptionByIdAsync(id, tenantId);
    }

    public async Task<ApiResponse<PrescriptionReceiptResponse>> GetPrescriptionReceiptAsync(Guid id, Guid tenantId)
    {
        var prescription = await _prescriptionRepo.GetByIdAsync(id, tenantId);
        if (prescription == null)
            return ApiResponse<PrescriptionReceiptResponse>.ErrorResponse("Prescription not found");

        var items = await _itemRepo.GetByPrescriptionIdAsync(prescription.Id, tenantId);
        var receiptItems = new List<ReceiptItemResponse>();

        foreach (var item in items)
        {
            var drug = await _drugRepo.GetByIdAsync(item.DrugId, tenantId);
            receiptItems.Add(new ReceiptItemResponse
            {
                DrugName = drug?.DrugName ?? "",
                Strength = drug?.Strength ?? "",
                Quantity = item.Quantity,
                Dosage = item.Dosage,
                Frequency = item.Frequency,
                Duration = item.Duration,
                Instructions = item.Instructions,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount
            });
        }

        var receipt = new PrescriptionReceiptResponse
        {
            PrescriptionNumber = prescription.PrescriptionNumber,
            PrescriptionDate = prescription.PrescriptionDate,
            DispensedAt = prescription.DispensedAt,
            PatientId = prescription.PatientId,
            DoctorId = prescription.DoctorId,
            TotalAmount = prescription.TotalAmount,
            Items = receiptItems
        };

        return ApiResponse<PrescriptionReceiptResponse>.SuccessResponse(receipt);
    }

    public async Task<ApiResponse<DailySalesReportResponse>> GetDailySalesReportAsync(DateTime date, Guid tenantId)
    {
        var count = await _prescriptionRepo.GetDailySalesCountAsync(tenantId, date);
        var revenue = await _prescriptionRepo.GetDailySalesRevenueAsync(tenantId, date);
        var topDrugs = await _itemRepo.GetTopDrugsByDateAsync(tenantId, date, 10);

        var report = new DailySalesReportResponse
        {
            Date = date.Date,
            TotalPrescriptions = count,
            TotalRevenue = revenue,
            TopDrugs = topDrugs.Select(d => new DrugSalesItem
            {
                DrugName = d.DrugName,
                QuantitySold = d.Quantity,
                Revenue = d.Revenue
            }).ToList()
        };

        return ApiResponse<DailySalesReportResponse>.SuccessResponse(report);
    }

    public async Task<ApiResponse<LowStockReportResponse>> GetLowStockReportAsync(Guid tenantId)
    {
        var drugs = await _drugRepo.GetAllAsync(tenantId);
        var lowStockItems = new List<LowStockItem>();

        foreach (var drug in drugs)
        {
            var stock = await _drugRepo.GetAvailableStockAsync(drug.Id, tenantId);
            if (stock < drug.ReorderLevel)
            {
                lowStockItems.Add(new LowStockItem
                {
                    DrugId = drug.Id,
                    DrugCode = drug.DrugCode,
                    DrugName = drug.DrugName,
                    AvailableStock = stock,
                    ReorderLevel = drug.ReorderLevel,
                    Status = stock == 0 ? "Out of Stock" : "Low Stock"
                });
            }
        }

        var report = new LowStockReportResponse
        {
            Items = lowStockItems.OrderBy(i => i.AvailableStock).ToList()
        };

        return ApiResponse<LowStockReportResponse>.SuccessResponse(report);
    }

    private async Task InvalidateDrugsCacheAsync(Guid tenantId)
    {
        var cacheKey = $"pharmacy:drugs:{tenantId}";
        await _redis.KeyDeleteAsync(cacheKey);
    }
}
