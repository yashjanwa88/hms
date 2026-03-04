using Dapper;
using Npgsql;
using Shared.Common.Interfaces;
using Shared.Common.Models;
using System.Data;

namespace Shared.Common.Helpers;

public abstract class BaseRepository<T> : IBaseRepository<T> where T : BaseEntity
{
    protected readonly string _connectionString;
    protected abstract string TableName { get; }

    protected BaseRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public virtual async Task<T?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = $"SELECT * FROM {TableName} WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<T>(sql, new { Id = id, TenantId = tenantId });
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = $"SELECT * FROM {TableName} WHERE tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryAsync<T>(sql, new { TenantId = tenantId });
    }

    public virtual async Task<PagedResult<T>> GetPagedAsync(PaginationRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = !string.IsNullOrEmpty(request.SortBy) 
            ? $"ORDER BY {request.SortBy} {request.SortOrder}" 
            : "ORDER BY created_at DESC";

        var sql = $@"
            SELECT * FROM {TableName} 
            WHERE tenant_id = @TenantId AND is_deleted = false
            {orderBy}
            LIMIT @PageSize OFFSET @Offset";

        var countSql = $"SELECT COUNT(*) FROM {TableName} WHERE tenant_id = @TenantId AND is_deleted = false";

        var items = await connection.QueryAsync<T>(sql, new { TenantId = tenantId, request.PageSize, Offset = offset });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { TenantId = tenantId });

        return new PagedResult<T>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public virtual async Task<Guid> CreateAsync(T entity)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.IsDeleted = false;

        using var connection = CreateConnection();
        var properties = typeof(T).GetProperties()
            .Where(p => p.Name != "Id")
            .Select(p => p.Name.ToSnakeCase());

        var columns = string.Join(", ", properties);
        var values = string.Join(", ", properties.Select(p => $"@{p.ToPascalCase()}"));

        var sql = $"INSERT INTO {TableName} (id, {columns}) VALUES (@Id, {values})";
        await connection.ExecuteAsync(sql, entity);
        return entity.Id;
    }

    public virtual async Task<bool> UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;

        using var connection = CreateConnection();
        var properties = typeof(T).GetProperties()
            .Where(p => p.Name != "Id" && p.Name != "CreatedAt" && p.Name != "CreatedBy" && p.Name != "TenantId")
            .Select(p => $"{p.Name.ToSnakeCase()} = @{p.Name}");

        var sql = $"UPDATE {TableName} SET {string.Join(", ", properties)} WHERE id = @Id AND tenant_id = @TenantId";
        var result = await connection.ExecuteAsync(sql, entity);
        return result > 0;
    }

    public virtual async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = $"DELETE FROM {TableName} WHERE id = @Id AND tenant_id = @TenantId";
        var result = await connection.ExecuteAsync(sql, new { Id = id, TenantId = tenantId });
        return result > 0;
    }

    public virtual async Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy)
    {
        using var connection = CreateConnection();
        var sql = $@"UPDATE {TableName} 
                    SET is_deleted = true, updated_at = @UpdatedAt, updated_by = @DeletedBy 
                    WHERE id = @Id AND tenant_id = @TenantId";
        var result = await connection.ExecuteAsync(sql, new { Id = id, TenantId = tenantId, UpdatedAt = DateTime.UtcNow, DeletedBy = deletedBy });
        return result > 0;
    }
}

public static class StringExtensions
{
    public static string ToSnakeCase(this string str)
    {
        return string.Concat(str.Select((x, i) => i > 0 && char.IsUpper(x) ? "_" + x.ToString() : x.ToString())).ToLower();
    }

    public static string ToPascalCase(this string str)
    {
        var parts = str.Split('_');
        return string.Concat(parts.Select(p => char.ToUpper(p[0]) + p.Substring(1)));
    }
}
