using Dapper;
using LaboratoryService.Domain;
using Npgsql;

namespace LaboratoryService.Repositories;

public interface ILabTestRepository
{
    Task<Guid> CreateAsync(LabTest labTest);
    Task<LabTest?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<LabTest>> GetAllAsync(Guid tenantId, bool includeInactive = false);
    Task<bool> TestCodeExistsAsync(string testCode, Guid tenantId, Guid? excludeId = null);
}

public class LabTestRepository : ILabTestRepository
{
    private readonly string _connectionString;

    public LabTestRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(LabTest labTest)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO lab_tests (id, tenant_id, test_code, test_name, description, category, price, 
                    turnaround_time_hours, sample_type, is_active, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @TestCode, @TestName, @Description, @Category, @Price, 
                    @TurnaroundTimeHours, @SampleType, @IsActive, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, labTest);
        return labTest.Id;
    }

    public async Task<LabTest?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM lab_tests WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<LabTest>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<LabTest>> GetAllAsync(Guid tenantId, bool includeInactive = false)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = includeInactive 
            ? "SELECT * FROM lab_tests WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY test_name"
            : "SELECT * FROM lab_tests WHERE tenant_id = @TenantId AND is_active = true AND is_deleted = false ORDER BY test_name";
        return (await conn.QueryAsync<LabTest>(sql, new { TenantId = tenantId })).ToList();
    }

    public async Task<bool> TestCodeExistsAsync(string testCode, Guid tenantId, Guid? excludeId = null)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = excludeId.HasValue
            ? "SELECT COUNT(1) FROM lab_tests WHERE test_code = @TestCode AND tenant_id = @TenantId AND id != @ExcludeId AND is_deleted = false"
            : "SELECT COUNT(1) FROM lab_tests WHERE test_code = @TestCode AND tenant_id = @TenantId AND is_deleted = false";
        var count = await conn.ExecuteScalarAsync<int>(sql, new { TestCode = testCode, TenantId = tenantId, ExcludeId = excludeId });
        return count > 0;
    }
}

public interface ILabTestParameterRepository
{
    Task<Guid> CreateAsync(LabTestParameter parameter);
    Task<List<LabTestParameter>> GetByLabTestIdAsync(Guid labTestId, Guid tenantId);
}

public class LabTestParameterRepository : ILabTestParameterRepository
{
    private readonly string _connectionString;

    public LabTestParameterRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(LabTestParameter parameter)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO lab_test_parameters (id, tenant_id, lab_test_id, parameter_name, unit, 
                    reference_min, reference_max, critical_min, critical_max, reference_range, display_order,
                    created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @LabTestId, @ParameterName, @Unit, @ReferenceMin, @ReferenceMax,
                    @CriticalMin, @CriticalMax, @ReferenceRange, @DisplayOrder, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, parameter);
        return parameter.Id;
    }

    public async Task<List<LabTestParameter>> GetByLabTestIdAsync(Guid labTestId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM lab_test_parameters 
                    WHERE lab_test_id = @LabTestId AND tenant_id = @TenantId AND is_deleted = false 
                    ORDER BY display_order";
        return (await conn.QueryAsync<LabTestParameter>(sql, new { LabTestId = labTestId, TenantId = tenantId })).ToList();
    }
}

public interface ILabOrderRepository
{
    Task<Guid> CreateAsync(LabOrder order);
    Task<LabOrder?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<LabOrder>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task UpdateAsync(LabOrder order);
    Task<string> GenerateOrderNumberAsync(Guid tenantId, string tenantCode);
}

public class LabOrderRepository : ILabOrderRepository
{
    private readonly string _connectionString;

    public LabOrderRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(LabOrder order)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO lab_orders (id, tenant_id, order_number, patient_id, encounter_id, doctor_id,
                    order_date, status, priority, clinical_notes, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @OrderNumber, @PatientId, @EncounterId, @DoctorId, @OrderDate,
                    @Status, @Priority, @ClinicalNotes, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, order);
        return order.Id;
    }

    public async Task<LabOrder?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM lab_orders WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<LabOrder>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<LabOrder>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM lab_orders 
                    WHERE patient_id = @PatientId AND tenant_id = @TenantId AND is_deleted = false 
                    ORDER BY order_date DESC";
        return (await conn.QueryAsync<LabOrder>(sql, new { PatientId = patientId, TenantId = tenantId })).ToList();
    }

    public async Task UpdateAsync(LabOrder order)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE lab_orders SET status = @Status, sample_collected_at = @SampleCollectedAt,
                    sample_collected_by = @SampleCollectedBy, completed_at = @CompletedAt, completed_by = @CompletedBy,
                    cancellation_reason = @CancellationReason, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, order);
    }

    public async Task<string> GenerateOrderNumberAsync(Guid tenantId, string tenantCode)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var year = DateTime.UtcNow.Year;
        
        var sql = @"INSERT INTO lab_sequences (id, tenant_id, tenant_code, year, last_sequence, updated_at)
                    VALUES (gen_random_uuid(), @TenantId, @TenantCode, @Year, 1, @UpdatedAt)
                    ON CONFLICT (tenant_id, year) 
                    DO UPDATE SET last_sequence = lab_sequences.last_sequence + 1, updated_at = @UpdatedAt
                    RETURNING last_sequence";
        
        var sequence = await conn.ExecuteScalarAsync<int>(sql, new { 
            TenantId = tenantId, 
            TenantCode = tenantCode, 
            Year = year, 
            UpdatedAt = DateTime.UtcNow 
        });
        
        return $"LAB-{tenantCode}-{year}-{sequence:D6}";
    }
}

public interface ILabOrderItemRepository
{
    Task<Guid> CreateAsync(LabOrderItem item);
    Task<List<LabOrderItem>> GetByOrderIdAsync(Guid orderId, Guid tenantId);
    Task<LabOrderItem?> GetByIdAsync(Guid id, Guid tenantId);
    Task UpdateAsync(LabOrderItem item);
}

public class LabOrderItemRepository : ILabOrderItemRepository
{
    private readonly string _connectionString;

    public LabOrderItemRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(LabOrderItem item)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO lab_order_items (id, tenant_id, lab_order_id, lab_test_id, status,
                    created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @LabOrderId, @LabTestId, @Status, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, item);
        return item.Id;
    }

    public async Task<List<LabOrderItem>> GetByOrderIdAsync(Guid orderId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM lab_order_items 
                    WHERE lab_order_id = @OrderId AND tenant_id = @TenantId AND is_deleted = false";
        return (await conn.QueryAsync<LabOrderItem>(sql, new { OrderId = orderId, TenantId = tenantId })).ToList();
    }

    public async Task<LabOrderItem?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = "SELECT * FROM lab_order_items WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await conn.QueryFirstOrDefaultAsync<LabOrderItem>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task UpdateAsync(LabOrderItem item)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"UPDATE lab_order_items SET status = @Status, result_entered_at = @ResultEnteredAt,
                    result_entered_by = @ResultEnteredBy, updated_at = @UpdatedAt, updated_by = @UpdatedBy
                    WHERE id = @Id AND tenant_id = @TenantId";
        await conn.ExecuteAsync(sql, item);
    }
}

public interface ILabResultRepository
{
    Task<Guid> CreateAsync(LabResult result);
    Task<List<LabResult>> GetByOrderItemIdAsync(Guid orderItemId, Guid tenantId);
    Task<int> CountAbnormalByOrderIdAsync(Guid orderId, Guid tenantId);
    Task<int> CountCriticalByOrderIdAsync(Guid orderId, Guid tenantId);
}

public class LabResultRepository : ILabResultRepository
{
    private readonly string _connectionString;

    public LabResultRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<Guid> CreateAsync(LabResult result)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"INSERT INTO lab_results (id, tenant_id, lab_order_item_id, lab_test_parameter_id, value,
                    is_abnormal, is_critical, comments, created_at, created_by, is_deleted)
                    VALUES (@Id, @TenantId, @LabOrderItemId, @LabTestParameterId, @Value, @IsAbnormal,
                    @IsCritical, @Comments, @CreatedAt, @CreatedBy, @IsDeleted)";
        await conn.ExecuteAsync(sql, result);
        return result.Id;
    }

    public async Task<List<LabResult>> GetByOrderItemIdAsync(Guid orderItemId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT * FROM lab_results 
                    WHERE lab_order_item_id = @OrderItemId AND tenant_id = @TenantId AND is_deleted = false";
        return (await conn.QueryAsync<LabResult>(sql, new { OrderItemId = orderItemId, TenantId = tenantId })).ToList();
    }

    public async Task<int> CountAbnormalByOrderIdAsync(Guid orderId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT COUNT(DISTINCT lr.id) FROM lab_results lr
                    INNER JOIN lab_order_items loi ON lr.lab_order_item_id = loi.id
                    WHERE loi.lab_order_id = @OrderId AND lr.tenant_id = @TenantId 
                    AND lr.is_abnormal = true AND lr.is_deleted = false";
        return await conn.ExecuteScalarAsync<int>(sql, new { OrderId = orderId, TenantId = tenantId });
    }

    public async Task<int> CountCriticalByOrderIdAsync(Guid orderId, Guid tenantId)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        var sql = @"SELECT COUNT(DISTINCT lr.id) FROM lab_results lr
                    INNER JOIN lab_order_items loi ON lr.lab_order_item_id = loi.id
                    WHERE loi.lab_order_id = @OrderId AND lr.tenant_id = @TenantId 
                    AND lr.is_critical = true AND lr.is_deleted = false";
        return await conn.ExecuteScalarAsync<int>(sql, new { OrderId = orderId, TenantId = tenantId });
    }
}
