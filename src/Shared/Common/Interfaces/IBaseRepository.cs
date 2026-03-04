using Shared.Common.Models;

namespace Shared.Common.Interfaces;

public interface IBaseRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<T>> GetAllAsync(Guid tenantId);
    Task<PagedResult<T>> GetPagedAsync(PaginationRequest request, Guid tenantId);
    Task<Guid> CreateAsync(T entity);
    Task<bool> UpdateAsync(T entity);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
    Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy);
}
