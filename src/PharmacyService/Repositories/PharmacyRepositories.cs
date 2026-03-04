using Dapper;
using Npgsql;
using PharmacyService.Domain;

namespace PharmacyService.Repositories;

public interface IDrugRepository
{
    Task<Guid> CreateAsync(Drug drug);
    Task<Drug?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<Drug>> GetAllAsync(Guid tenantId);
    Task UpdateAsync(Drug drug);
    Task<bool> DrugCodeExistsAsync(string drugCode, Guid tenantId, Guid? excludeId = null);
    Task<int> GetAvailableStockAsync(Guid drugId, Guid tenantId);
}

public class DrugRepository : IDrugRepository
{
    private readonly string _connectionString;

    public DrugRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(Drug drug)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO drugs (id, tenant_id, drug_code, drug_name, generic_name, category, manufacturer,
                    strength, dosage_form, unit_price, reorder_level, is_controlled, requires_prescription, is_active,
                    created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @DrugCode, @DrugName, @GenericName, @Category, @Manufacturer,
                    @Strength, @DosageForm, @UnitPrice, @ReorderLevel, @IsControlled, @RequiresPrescription, @IsActive,
                    @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, drug);
        return drug.Id;
    }

    public async Task<Drug?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM drugs WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<Drug>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<Drug>> GetAllAsync(Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM drugs WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY drug_name";
        return (await conn.QueryAsync<Drug>(sql, new { TenantId = tenantId })).ToList();
    }

    public async Task UpdateAsync(Drug drug)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE drugs SET drug_name = @DrugName, generic_name = @GenericName, category = @Category,
                    manufacturer = @Manufacturer, strength = @Strength, dosage_form = @DosageForm, unit_price = @UnitPrice,
                    reorder_level = @ReorderLevel, is_controlled = @IsControlled, requires_prescription = @RequiresPrescription,
                    is_active = @IsActive, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, drug);
    }

    public async Task<bool> DrugCodeExistsAsync(string drugCode, Guid tenantId, Guid? excludeId = null)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = excludeId.HasValue
            ? "SELECT COUNT(1) FROM drugs WHERE drug_code = @DrugCode AND tenant_id = @TenantId AND id != @ExcludeId AND is_deleted = false"
            : "SELECT COUNT(1) FROM drugs WHERE drug_code = @DrugCode AND tenant_id = @TenantId AND is_deleted = false";
        var count = await conn.ExecuteScalarAsync<int>(sql, new { DrugCode = drugCode, TenantId = tenantId, ExcludeId = excludeId });
        return count > 0;
    }

    public async Task<int> GetAvailableStockAsync(Guid drugId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT COALESCE(SUM(quantity), 0) FROM drug_batches 
                    WHERE drug_id = @DrugId AND tenant_id = @TenantId 
                    AND expiry_date > NOW() AND is_deleted = false";
        return await conn.ExecuteScalarAsync<int>(sql, new { DrugId = drugId, TenantId = tenantId });
    }
}

public interface IDrugBatchRepository
{
    Task<Guid> CreateAsync(DrugBatch batch);
    Task<List<DrugBatch>> GetByDrugIdAsync(Guid drugId, Guid tenantId);
    Task<List<DrugBatch>> GetFEFOBatchesAsync(Guid drugId, Guid tenantId, int requiredQuantity);
    Task UpdateQuantityAsync(Guid batchId, int newQuantity, Guid tenantId);
}

public class DrugBatchRepository : IDrugBatchRepository
{
    private readonly string _connectionString;

    public DrugBatchRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(DrugBatch batch)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO drug_batches (id, tenant_id, drug_id, batch_number, manufacture_date, expiry_date,
                    quantity, cost_price, selling_price, supplier, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @DrugId, @BatchNumber, @ManufactureDate, @ExpiryDate,
                    @Quantity, @CostPrice, @SellingPrice, @Supplier, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, batch);
        return batch.Id;
    }

    public async Task<List<DrugBatch>> GetByDrugIdAsync(Guid drugId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM drug_batches 
                    WHERE drug_id = @DrugId AND tenant_id = @TenantId AND is_deleted = false 
                    ORDER BY expiry_date, manufacture_date";
        return (await conn.QueryAsync<DrugBatch>(sql, new { DrugId = drugId, TenantId = tenantId })).ToList();
    }

    public async Task<List<DrugBatch>> GetFEFOBatchesAsync(Guid drugId, Guid tenantId, int requiredQuantity)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM drug_batches 
                    WHERE drug_id = @DrugId AND tenant_id = @TenantId 
                    AND expiry_date > NOW() AND quantity > 0 AND is_deleted = false
                    ORDER BY expiry_date, manufacture_date
                    LIMIT 10";
        return (await conn.QueryAsync<DrugBatch>(sql, new { DrugId = drugId, TenantId = tenantId })).ToList();
    }

    public async Task UpdateQuantityAsync(Guid batchId, int newQuantity, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE drug_batches SET quantity = @NewQuantity, updated_at = @UpdatedAt 
                    WHERE id = @BatchId AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, new { BatchId = batchId, NewQuantity = newQuantity, TenantId = tenantId, UpdatedAt = DateTime.UtcNow });
    }
}

public interface IPrescriptionRepository
{
    Task<Guid> CreateAsync(Prescription prescription);
    Task<Prescription?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<Prescription>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task UpdateAsync(Prescription prescription);
    Task<string> GeneratePrescriptionNumberAsync(Guid tenantId, string tenantCode);
    Task<int> GetDailySalesCountAsync(Guid tenantId, DateTime date);
    Task<decimal> GetDailySalesRevenueAsync(Guid tenantId, DateTime date);
}

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly string _connectionString;

    public PrescriptionRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(Prescription prescription)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO prescriptions (id, tenant_id, prescription_number, patient_id, encounter_id, doctor_id,
                    prescription_date, status, total_amount, notes, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @PrescriptionNumber, @PatientId, @EncounterId, @DoctorId,
                    @PrescriptionDate, @Status, @TotalAmount, @Notes, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, prescription);
        return prescription.Id;
    }

    public async Task<Prescription?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM prescriptions WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<Prescription>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<Prescription>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM prescriptions 
                    WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false 
                    ORDER BY prescription_date DESC";
        return (await conn.QueryAsync<Prescription>(sql, new { PatientId = patientId, TenantId = tenantId })).ToList();
    }

    public async Task UpdateAsync(Prescription prescription)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE prescriptions SET status = @Status, verified_at = @VerifiedAt, verified_by = @VerifiedBy,
                    dispensed_at = @DispensedAt, dispensed_by = @DispensedBy, total_amount = @TotalAmount,
                    cancellation_reason = @CancellationReason, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, prescription);
    }

    public async Task<string> GeneratePrescriptionNumberAsync(Guid tenantId, string tenantCode)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var year = DateTime.UtcNow.Year;
        
        var sql = @"INSERT INTO pharmacy_sequences (id, tenant_id, tenant_code, year, last_sequence, updated_at)
                    VALUES (gen_random_uuid(), @TenantId, @TenantCode, @Year, 1, @UpdatedAt)
                    ON CONFLICT (tenant_id, year) 
                    DO UPDATE SET last_sequence = pharmacy_sequences.last_sequence + 1, updated_at = @UpdatedAt
                    RETURNING last_sequence";
        
        var sequence = await conn.ExecuteScalarAsync<int>(sql, new { 
            TenantId = tenantId, 
            TenantCode = tenantCode, 
            Year = year, 
            UpdatedAt = DateTime.UtcNow 
        });
        
        return $"RX-{tenantCode}-{year}-{sequence:D6}";
    }

    public async Task<int> GetDailySalesCountAsync(Guid tenantId, DateTime date)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT COUNT(*) FROM prescriptions 
                    WHERE tenant_id = @TenantId AND status = 'Dispensed' 
                    AND DATE(dispensed_at) = @Date AND is_deleted = false";
        return await conn.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Date = date.Date });
    }

    public async Task<decimal> GetDailySalesRevenueAsync(Guid tenantId, DateTime date)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT COALESCE(SUM(total_amount), 0) FROM prescriptions 
                    WHERE tenant_id = @TenantId AND status = 'Dispensed' 
                    AND DATE(dispensed_at) = @Date AND is_deleted = false";
        return await conn.ExecuteScalarAsync<decimal>(sql, new { TenantId = tenantId, Date = date.Date });
    }
}

public interface IPrescriptionItemRepository
{
    Task<Guid> CreateAsync(PrescriptionItem item);
    Task<List<PrescriptionItem>> GetByPrescriptionIdAsync(Guid prescriptionId, Guid tenantId);
    Task UpdateAsync(PrescriptionItem item);
    Task<List<(Guid DrugId, string DrugName, int Quantity, decimal Revenue)>> GetTopDrugsByDateAsync(Guid tenantId, DateTime date, int limit);
}

public class PrescriptionItemRepository : IPrescriptionItemRepository
{
    private readonly string _connectionString;

    public PrescriptionItemRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(PrescriptionItem item)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO prescription_items (id, tenant_id, prescription_id, drug_id, quantity, dosage, frequency,
                    duration, instructions, unit_price, amount, is_dispensed, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @PrescriptionId, @DrugId, @Quantity, @Dosage, @Frequency,
                    @Duration, @Instructions, @UnitPrice, @Amount, @IsDispensed, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, item);
        return item.Id;
    }

    public async Task<List<PrescriptionItem>> GetByPrescriptionIdAsync(Guid prescriptionId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM prescription_items 
                    WHERE prescription_id = @PrescriptionId AND tenant_id = @TenantId AND is_deleted = false";
        return (await conn.QueryAsync<PrescriptionItem>(sql, new { PrescriptionId = prescriptionId, TenantId = tenantId })).ToList();
    }

    public async Task UpdateAsync(PrescriptionItem item)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE prescription_items SET is_dispensed = @IsDispensed, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, item);
    }

    public async Task<List<(Guid DrugId, string DrugName, int Quantity, decimal Revenue)>> GetTopDrugsByDateAsync(Guid tenantId, DateTime date, int limit)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT pi.drug_id, d.drug_name, SUM(pi.quantity) as quantity, SUM(pi.amount) as revenue
                    FROM prescription_items pi
                    INNER JOIN prescriptions p ON pi.prescription_id = p.id
                    INNER JOIN drugs d ON pi.drug_id = d.id
                    WHERE pi.tenant_id = @TenantId AND p.status = 'Dispensed' 
                    AND DATE(p.dispensed_at) = @Date AND pi.is_deleted = false
                    GROUP BY pi.drug_id, d.drug_name
                    ORDER BY revenue DESC
                    LIMIT @Limit";
        var results = await conn.QueryAsync<(Guid, string, int, decimal)>(sql, new { TenantId = tenantId, Date = date.Date, Limit = limit });
        return results.ToList();
    }
}

public interface IDispenseLogRepository
{
    Task<Guid> CreateAsync(DispenseLog log);
}

public class DispenseLogRepository : IDispenseLogRepository
{
    private readonly string _connectionString;

    public DispenseLogRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(DispenseLog log)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO dispense_logs (id, tenant_id, prescription_item_id, drug_batch_id, quantity_dispensed,
                    dispensed_at, dispensed_by, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @PrescriptionItemId, @DrugBatchId, @QuantityDispensed,
                    @DispensedAt, @DispensedBy, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, log);
        return log.Id;
    }
}
