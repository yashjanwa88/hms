using IdentityService.Domain;
using Shared.Common.Helpers;

namespace IdentityService.Repositories;

public interface ILoginAuditRepository
{
    Task<Guid> CreateAsync(LoginAudit audit);
}

public class LoginAuditRepository : BaseRepository<LoginAudit>, ILoginAuditRepository
{
    protected override string TableName => "login_audits";

    public LoginAuditRepository(string connectionString) : base(connectionString) { }
}
