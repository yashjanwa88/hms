using Dapper;
using DoctorService.Domain;
using DoctorService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace DoctorService.Repositories;

public interface IDoctorRepository
{
    Task<Doctor?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Doctor?> GetByCodeAsync(string doctorCode, Guid tenantId);
    Task<Guid> CreateAsync(Doctor doctor);
    Task<bool> UpdateAsync(Doctor doctor);
    Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy);
    Task<PagedResult<Doctor>> SearchAsync(DoctorSearchRequest request, Guid tenantId);
    Task<string> GenerateDoctorCodeAsync(Guid tenantId, string tenantCode);
    Task<bool> IsMobileNumberExistsAsync(string mobileNumber, Guid tenantId, Guid? excludeDoctorId = null);
}

public class DoctorRepository : BaseRepository<Doctor>, IDoctorRepository
{
    protected override string TableName => "doctors";

    public DoctorRepository(string connectionString) : base(connectionString) { }

    public override async Task<Doctor?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, doctor_code as DoctorCode,
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            date_of_birth as DateOfBirth, gender as Gender, mobile_number as MobileNumber,
            email as Email, license_number as LicenseNumber, license_expiry_date as LicenseExpiryDate,
            experience_years as ExperienceYears, department as Department, consultation_fee as ConsultationFee,
            is_active as IsActive, emergency_contact_name as EmergencyContactName,
            emergency_contact_number as EmergencyContactNumber,
            created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt,
            updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM doctors WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Doctor>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<Doctor?> GetByCodeAsync(string doctorCode, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM doctors WHERE doctor_code = @DoctorCode AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Doctor>(sql, new { DoctorCode = doctorCode, TenantId = tenantId });
    }

    public async Task<PagedResult<Doctor>> SearchAsync(DoctorSearchRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var whereClause = "WHERE tenant_id = @TenantId AND is_deleted = false";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (!string.IsNullOrEmpty(request.DoctorCode))
        {
            whereClause += " AND doctor_code = @DoctorCode";
            parameters.Add("DoctorCode", request.DoctorCode);
        }

        if (!string.IsNullOrEmpty(request.Department))
        {
            whereClause += " AND department ILIKE @Department";
            parameters.Add("Department", $"%{request.Department}%");
        }

        if (!string.IsNullOrEmpty(request.Specialization))
        {
            whereClause += " AND EXISTS (SELECT 1 FROM doctor_specializations ds WHERE ds.doctor_id = doctors.id AND ds.specialization_name ILIKE @Specialization AND ds.is_deleted = false)";
            parameters.Add("Specialization", $"%{request.Specialization}%");
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (request.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                whereClause += " AND is_active = true";
            }
            else if (request.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                whereClause += " AND is_active = false";
            }
        }

        if (request.IsActive.HasValue)
        {
            whereClause += " AND is_active = @IsActive";
            parameters.Add("IsActive", request.IsActive.Value);
        }

        var searchTerm = !string.IsNullOrEmpty(request.Search) ? request.Search : request.SearchTerm;
        if (!string.IsNullOrEmpty(searchTerm))
        {
            whereClause += " AND (first_name ILIKE @SearchTerm OR last_name ILIKE @SearchTerm OR doctor_code ILIKE @SearchTerm OR email ILIKE @SearchTerm)";
            parameters.Add("SearchTerm", $"%{searchTerm}%");
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $@"SELECT 
            id as Id, tenant_id as TenantId, doctor_code as DoctorCode,
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            date_of_birth as DateOfBirth, gender as Gender, mobile_number as MobileNumber,
            email as Email, license_number as LicenseNumber, license_expiry_date as LicenseExpiryDate,
            experience_years as ExperienceYears, department as Department, consultation_fee as ConsultationFee,
            is_active as IsActive, emergency_contact_name as EmergencyContactName,
            emergency_contact_number as EmergencyContactNumber,
            created_at as CreatedAt, created_by as CreatedBy, updated_at as UpdatedAt,
            updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM doctors {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        var countSql = $"SELECT COUNT(*) FROM doctors {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Doctor>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Doctor>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<string> GenerateDoctorCodeAsync(Guid tenantId, string tenantCode)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_code FROM POSITION('-' IN SUBSTRING(doctor_code FROM 5)) + 5) AS INTEGER)), 0) + 1
            FROM doctors 
            WHERE tenant_id = @TenantId 
            AND doctor_code LIKE @Pattern";

        var pattern = $"DOC-{tenantCode}-%";
        var nextNumber = await connection.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Pattern = pattern });

        return $"DOC-{tenantCode}-{nextNumber:D6}";
    }

    public async Task<bool> IsMobileNumberExistsAsync(string mobileNumber, Guid tenantId, Guid? excludeDoctorId = null)
    {
        using var connection = CreateConnection();
        var sql = "SELECT COUNT(*) FROM doctors WHERE mobile_number = @MobileNumber AND tenant_id = @TenantId AND is_deleted = false";
        
        if (excludeDoctorId.HasValue)
        {
            sql += " AND id != @ExcludeDoctorId";
        }

        var count = await connection.ExecuteScalarAsync<int>(sql, new { MobileNumber = mobileNumber, TenantId = tenantId, ExcludeDoctorId = excludeDoctorId });
        return count > 0;
    }
}

public interface IDoctorSpecializationRepository
{
    Task<Guid> CreateAsync(DoctorSpecialization specialization);
    Task<IEnumerable<DoctorSpecialization>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId);
}

public class DoctorSpecializationRepository : BaseRepository<DoctorSpecialization>, IDoctorSpecializationRepository
{
    protected override string TableName => "doctor_specializations";

    public DoctorSpecializationRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<DoctorSpecialization>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM doctor_specializations WHERE doctor_id = @DoctorId AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryAsync<DoctorSpecialization>(sql, new { DoctorId = doctorId, TenantId = tenantId });
    }
}

public interface IDoctorQualificationRepository
{
    Task<Guid> CreateAsync(DoctorQualification qualification);
    Task<IEnumerable<DoctorQualification>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId);
}

public class DoctorQualificationRepository : BaseRepository<DoctorQualification>, IDoctorQualificationRepository
{
    protected override string TableName => "doctor_qualifications";

    public DoctorQualificationRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<DoctorQualification>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM doctor_qualifications WHERE doctor_id = @DoctorId AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryAsync<DoctorQualification>(sql, new { DoctorId = doctorId, TenantId = tenantId });
    }
}

public interface IDoctorAvailabilityRepository
{
    Task<Guid> CreateAsync(DoctorAvailability availability);
    Task<IEnumerable<DoctorAvailability>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId);
    Task<bool> HasOverlappingAvailabilityAsync(Guid doctorId, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, Guid tenantId);
}

public class DoctorAvailabilityRepository : BaseRepository<DoctorAvailability>, IDoctorAvailabilityRepository
{
    protected override string TableName => "doctor_availability";

    public DoctorAvailabilityRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<DoctorAvailability>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM doctor_availability WHERE doctor_id = @DoctorId AND tenant_id = @TenantId AND is_deleted = false ORDER BY day_of_week, start_time";
        return await connection.QueryAsync<DoctorAvailability>(sql, new { DoctorId = doctorId, TenantId = tenantId });
    }

    public async Task<bool> HasOverlappingAvailabilityAsync(Guid doctorId, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"
            SELECT COUNT(*) FROM doctor_availability 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND day_of_week = @DayOfWeek 
            AND is_deleted = false
            AND (
                (start_time <= @StartTime AND end_time > @StartTime)
                OR (start_time < @EndTime AND end_time >= @EndTime)
                OR (start_time >= @StartTime AND end_time <= @EndTime)
            )";

        var count = await connection.ExecuteScalarAsync<int>(sql, new 
        { 
            DoctorId = doctorId, 
            TenantId = tenantId, 
            DayOfWeek = dayOfWeek, 
            StartTime = startTime, 
            EndTime = endTime 
        });
        return count > 0;
    }
}

public interface IDoctorLeaveRepository
{
    Task<Guid> CreateAsync(DoctorLeave leave);
    Task<IEnumerable<DoctorLeave>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId);
    Task<bool> HasOverlappingLeaveAsync(Guid doctorId, DateTime startDate, DateTime endDate, Guid tenantId);
}

public class DoctorLeaveRepository : BaseRepository<DoctorLeave>, IDoctorLeaveRepository
{
    protected override string TableName => "doctor_leave";

    public DoctorLeaveRepository(string connectionString) : base(connectionString) { }

    public async Task<IEnumerable<DoctorLeave>> GetByDoctorIdAsync(Guid doctorId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM doctor_leave WHERE doctor_id = @DoctorId AND tenant_id = @TenantId AND is_deleted = false ORDER BY start_date DESC";
        return await connection.QueryAsync<DoctorLeave>(sql, new { DoctorId = doctorId, TenantId = tenantId });
    }

    public async Task<bool> HasOverlappingLeaveAsync(Guid doctorId, DateTime startDate, DateTime endDate, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"
            SELECT COUNT(*) FROM doctor_leave 
            WHERE doctor_id = @DoctorId 
            AND tenant_id = @TenantId 
            AND is_deleted = false
            AND status != 'Rejected'
            AND (
                (start_date <= @StartDate AND end_date >= @StartDate)
                OR (start_date <= @EndDate AND end_date >= @EndDate)
                OR (start_date >= @StartDate AND end_date <= @EndDate)
            )";

        var count = await connection.ExecuteScalarAsync<int>(sql, new 
        { 
            DoctorId = doctorId, 
            TenantId = tenantId, 
            StartDate = startDate, 
            EndDate = endDate 
        });
        return count > 0;
    }
}
