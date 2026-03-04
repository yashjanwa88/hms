using Dapper;
using BillingService.Domain;
using BillingService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace BillingService.Repositories;

public interface IBillingRepository
{
    Task<Guid> CreateInvoiceAsync(Invoice invoice);
    Task<Invoice?> GetInvoiceByIdAsync(Guid id, Guid tenantId);
    Task<Invoice?> GetInvoiceByEncounterAsync(Guid encounterId, Guid tenantId);
    Task<bool> UpdateInvoiceAsync(Invoice invoice);
    Task<string> GenerateInvoiceNumberAsync(Guid tenantId, string tenantCode);
    Task<PagedResult<Invoice>> SearchInvoicesAsync(InvoiceSearchRequest request, Guid tenantId);
    Task<Guid> AddInvoiceItemAsync(InvoiceItem item);
    Task<List<InvoiceItem>> GetInvoiceItemsAsync(Guid invoiceId);
    Task<bool> RecalculateInvoiceTotalsAsync(Guid invoiceId, Guid tenantId);
    Task<Guid> ProcessRefundAsync(Refund refund);
    Task<List<dynamic>> GetPendingRefundsAsync(Guid tenantId);
    Task ApproveRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy);
    Task RejectRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy);
}

public class BillingRepository : BaseRepository<Invoice>, IBillingRepository
{
    protected override string TableName => "invoices";

    public BillingRepository(string connectionString) : base(connectionString) { }

    public async Task<Guid> CreateInvoiceAsync(Invoice invoice)
    {
        invoice.Id = Guid.NewGuid();
        invoice.CreatedAt = DateTime.UtcNow;
        invoice.IsDeleted = false;
        invoice.Status = "Pending";

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO invoices (
                id, tenant_id, patient_id, encounter_id, invoice_number,
                subtotal, tax, discount, grand_total, paid_amount, status,
                created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @PatientId, @EncounterId, @InvoiceNumber,
                @Subtotal, @Tax, @Discount, @GrandTotal, @PaidAmount, @Status,
                @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, invoice);
        return invoice.Id;
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, encounter_id as EncounterId,
            invoice_number as InvoiceNumber, subtotal as Subtotal, tax as Tax, discount as Discount,
            grand_total as GrandTotal, paid_amount as PaidAmount, status as Status,
            payment_method as PaymentMethod, payment_date as PaymentDate,
            created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt,
            updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM invoices WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Invoice>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<Invoice?> GetInvoiceByEncounterAsync(Guid encounterId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, encounter_id as EncounterId,
            invoice_number as InvoiceNumber, subtotal as Subtotal, tax as Tax, discount as Discount,
            grand_total as GrandTotal, paid_amount as PaidAmount, status as Status,
            payment_method as PaymentMethod, payment_date as PaymentDate,
            created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt,
            updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM invoices WHERE encounter_id = @EncounterId AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Invoice>(sql, new { EncounterId = encounterId, TenantId = tenantId });
    }

    public async Task<bool> UpdateInvoiceAsync(Invoice invoice)
    {
        invoice.UpdatedAt = DateTime.UtcNow;

        using var connection = CreateConnection();
        var sql = @"
            UPDATE invoices SET
                subtotal = @Subtotal, tax = @Tax, discount = @Discount,
                grand_total = @GrandTotal, paid_amount = @PaidAmount, status = @Status,
                payment_method = @PaymentMethod, payment_date = @PaymentDate,
                updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";

        var rows = await connection.ExecuteAsync(sql, invoice);
        return rows > 0;
    }

    public async Task<string> GenerateInvoiceNumberAsync(Guid tenantId, string tenantCode)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            var year = DateTime.UtcNow.Year;
            
            var seqSql = @"
                INSERT INTO invoice_sequences (id, tenant_id, tenant_code, year, last_sequence, created_at, is_deleted)
                VALUES (uuid_generate_v4(), @TenantId, @TenantCode, @Year, 1, NOW(), false)
                ON CONFLICT (tenant_id, year) 
                DO UPDATE SET 
                    last_sequence = invoice_sequences.last_sequence + 1,
                    updated_at = NOW()
                RETURNING last_sequence";
            
            var sequence = await connection.ExecuteScalarAsync<int>(seqSql, new { TenantId = tenantId, TenantCode = tenantCode, Year = year }, transaction);
            
            transaction.Commit();
            
            return $"INV-{tenantCode}-{year}-{sequence:D6}";
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<PagedResult<Invoice>> SearchInvoicesAsync(InvoiceSearchRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var whereClause = "WHERE tenant_id = @TenantId AND is_deleted = false";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (request.PatientId.HasValue)
        {
            whereClause += " AND patient_id = @PatientId";
            parameters.Add("PatientId", request.PatientId.Value);
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            whereClause += " AND status = @Status";
            parameters.Add("Status", request.Status);
        }

        if (request.FromDate.HasValue)
        {
            whereClause += " AND created_at >= @FromDate";
            parameters.Add("FromDate", request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            whereClause += " AND created_at <= @ToDate";
            parameters.Add("ToDate", request.ToDate.Value);
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $@"SELECT 
            id as Id, tenant_id as TenantId, patient_id as PatientId, encounter_id as EncounterId,
            invoice_number as InvoiceNumber, subtotal as Subtotal, tax as Tax, discount as Discount,
            grand_total as GrandTotal, paid_amount as PaidAmount, status as Status,
            payment_method as PaymentMethod, payment_date as PaymentDate,
            created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt,
            updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM invoices {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        
        var countSql = $"SELECT COUNT(*) FROM invoices {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Invoice>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Invoice>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<Guid> AddInvoiceItemAsync(InvoiceItem item)
    {
        item.Id = Guid.NewGuid();
        item.CreatedAt = DateTime.UtcNow;
        item.IsDeleted = false;
        item.TotalPrice = item.Quantity * item.UnitPrice;

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO invoice_items (
                id, invoice_id, item_type, description, quantity, unit_price, total_price,
                created_at, created_by, is_deleted
            ) VALUES (
                @Id, @InvoiceId, @ItemType, @Description, @Quantity, @UnitPrice, @TotalPrice,
                @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, item);
        return item.Id;
    }

    public async Task<List<InvoiceItem>> GetInvoiceItemsAsync(Guid invoiceId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, invoice_id as InvoiceId, item_type as ItemType, description as Description,
            quantity as Quantity, unit_price as UnitPrice, total_price as TotalPrice,
            created_at as CreatedAt, created_by as CreatedBy, is_deleted as IsDeleted
            FROM invoice_items WHERE invoice_id = @InvoiceId AND is_deleted = false";
        
        var result = await connection.QueryAsync<InvoiceItem>(sql, new { InvoiceId = invoiceId });
        return result.ToList();
    }

    public async Task<bool> RecalculateInvoiceTotalsAsync(Guid invoiceId, Guid tenantId)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            // Get current invoice
            var invoice = await connection.QueryFirstOrDefaultAsync<Invoice>(
                "SELECT * FROM invoices WHERE id = @Id AND tenant_id = @TenantId",
                new { Id = invoiceId, TenantId = tenantId },
                transaction
            );

            if (invoice == null) return false;

            // Calculate subtotal from items
            var subtotal = await connection.ExecuteScalarAsync<decimal>(
                "SELECT COALESCE(SUM(total_price), 0) FROM invoice_items WHERE invoice_id = @InvoiceId AND is_deleted = false",
                new { InvoiceId = invoiceId },
                transaction
            );

            // Calculate grand total
            var grandTotal = subtotal + invoice.Tax - invoice.Discount;

            // Update invoice
            await connection.ExecuteAsync(
                @"UPDATE invoices SET 
                    subtotal = @Subtotal, 
                    grand_total = @GrandTotal, 
                    updated_at = @UpdatedAt 
                  WHERE id = @Id",
                new { Subtotal = subtotal, GrandTotal = grandTotal, UpdatedAt = DateTime.UtcNow, Id = invoiceId },
                transaction
            );

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<Guid> ProcessRefundAsync(Refund refund)
    {
        refund.Id = Guid.NewGuid();
        refund.ProcessedAt = DateTime.UtcNow;
        refund.CreatedAt = DateTime.UtcNow;
        refund.IsDeleted = false;

        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            // Insert refund
            var refundSql = @"
                INSERT INTO refunds (
                    id, tenant_id, invoice_id, refund_amount, reason, refund_method,
                    processed_by, processed_at, created_at, created_by, is_deleted
                ) VALUES (
                    @Id, @TenantId, @InvoiceId, @RefundAmount, @Reason, @RefundMethod,
                    @ProcessedBy, @ProcessedAt, @CreatedAt, @CreatedBy, @IsDeleted
                )";

            await connection.ExecuteAsync(refundSql, refund, transaction);

            // Update invoice refunded_amount and paid_amount
            var updateInvoiceSql = @"
                UPDATE invoices SET
                    refunded_amount = COALESCE(refunded_amount, 0) + @RefundAmount,
                    paid_amount = paid_amount - @RefundAmount,
                    status = CASE 
                        WHEN paid_amount - @RefundAmount <= 0 THEN 'Pending'
                        WHEN paid_amount - @RefundAmount < grand_total THEN 'Partial'
                        ELSE status
                    END,
                    updated_at = NOW()
                WHERE id = @InvoiceId";

            await connection.ExecuteAsync(updateInvoiceSql, new { RefundAmount = refund.RefundAmount, InvoiceId = refund.InvoiceId }, transaction);

            transaction.Commit();
            return refund.Id;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<List<dynamic>> GetPendingRefundsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            r.id as Id, r.invoice_id as InvoiceId, i.invoice_number as InvoiceNumber,
            r.refund_amount as RefundAmount, r.reason as Reason, r.refund_method as RefundMethod,
            r.processed_by as ProcessedBy, r.processed_at as ProcessedAt, r.status as Status
            FROM refunds r
            INNER JOIN invoices i ON r.invoice_id = i.id
            WHERE r.tenant_id = @TenantId AND r.status = 'Pending' AND r.is_deleted = false
            ORDER BY r.created_at DESC";
        
        var result = await connection.QueryAsync(sql, new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task ApproveRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy)
    {
        using var connection = CreateConnection();
        var sql = @"UPDATE refunds SET 
            status = 'Approved', 
            approved_by = @ApprovedBy, 
            approved_at = NOW()
            WHERE id = @RefundId AND tenant_id = @TenantId";
        
        await connection.ExecuteAsync(sql, new { RefundId = refundId, TenantId = tenantId, ApprovedBy = approvedBy });
    }

    public async Task RejectRefundAsync(Guid refundId, string comments, Guid tenantId, Guid approvedBy)
    {
        using var connection = CreateConnection();
        var sql = @"UPDATE refunds SET 
            status = 'Rejected', 
            approved_by = @ApprovedBy, 
            approved_at = NOW(), 
            rejection_reason = @Comments
            WHERE id = @RefundId AND tenant_id = @TenantId";
        
        await connection.ExecuteAsync(sql, new { RefundId = refundId, TenantId = tenantId, ApprovedBy = approvedBy, Comments = comments });
    }
}
