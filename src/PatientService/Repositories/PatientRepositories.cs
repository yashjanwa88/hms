using Dapper;
using PatientService.Domain;
using PatientService.DTOs;
using Shared.Common.Helpers;
using Shared.Common.Models;

namespace PatientService.Repositories;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Patient?> GetByUHIDAsync(string uhid, Guid tenantId);
    Task<Guid> CreateAsync(Patient patient);
    Task<bool> UpdateAsync(Patient patient);
    Task<bool> SoftDeleteAsync(Guid id, Guid tenantId, Guid deletedBy);
    Task<PagedResult<Patient>> SearchAsync(PatientSearchRequest request, Guid tenantId);
    Task<string> GenerateUHIDAsync(Guid tenantId, string tenantCode);
    Task<List<Patient>> CheckDuplicatesAsync(Guid tenantId, string mobileNumber, string firstName, string lastName, DateTime dateOfBirth);
    Task<bool> MergePatientsAsync(Guid primaryId, Guid secondaryId, Guid tenantId, Guid mergedBy);
    Task<PatientStatsResponse> GetStatsAsync(Guid tenantId);
    Task<bool> IncrementVisitCountAsync(Guid patientId, Guid tenantId);
}

public class PatientRepository : BaseRepository<Patient>, IPatientRepository
{
    protected override string TableName => "patients";

    public PatientRepository(string connectionString) : base(connectionString) { }

    public override async Task<Guid> CreateAsync(Patient patient)
    {
        patient.Id = Guid.NewGuid();
        patient.RegistrationDate = DateTime.UtcNow;
        patient.CreatedAt = DateTime.UtcNow;
        patient.IsDeleted = false;
        patient.Status = "Active";
        patient.VisitCount = 0;

        using var connection = CreateConnection();
        var sql = @"
            INSERT INTO patients (
                id, tenant_id, uhid, first_name, middle_name, last_name, gender, date_of_birth, 
                blood_group, marital_status, mobile_number, alternate_mobile, email, whatsapp_number,
                address_line1, address_line2, city, state, pincode, country,
                allergies_summary, chronic_conditions, current_medications, disability_status, organ_donor,
                emergency_contact_name, emergency_contact_relation, emergency_contact_mobile,
                insurance_provider_id, policy_number, valid_from, valid_to,
                registration_date, registered_by, status, visit_count, created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @UHID, @FirstName, @MiddleName, @LastName, @Gender, @DateOfBirth,
                @BloodGroup, @MaritalStatus, @MobileNumber, @AlternateMobile, @Email, @WhatsAppNumber,
                @AddressLine1, @AddressLine2, @City, @State, @Pincode, @Country,
                @AllergiesSummary, @ChronicConditions, @CurrentMedications, @DisabilityStatus, @OrganDonor,
                @EmergencyContactName, @EmergencyContactRelation, @EmergencyContactMobile,
                @InsuranceProviderId, @PolicyNumber, @ValidFrom, @ValidTo,
                @RegistrationDate, @RegisteredBy, @Status, @VisitCount, @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, patient);
        return patient.Id;
    }

    public override async Task<bool> UpdateAsync(Patient patient)
    {
        patient.UpdatedAt = DateTime.UtcNow;

        using var connection = CreateConnection();
        var sql = @"
            UPDATE patients SET
                first_name = @FirstName, middle_name = @MiddleName, last_name = @LastName,
                gender = @Gender, date_of_birth = @DateOfBirth, blood_group = @BloodGroup,
                marital_status = @MaritalStatus, mobile_number = @MobileNumber,
                alternate_mobile = @AlternateMobile, email = @Email, whatsapp_number = @WhatsAppNumber,
                address_line1 = @AddressLine1, address_line2 = @AddressLine2, city = @City,
                state = @State, pincode = @Pincode, country = @Country,
                allergies_summary = @AllergiesSummary, chronic_conditions = @ChronicConditions,
                current_medications = @CurrentMedications, disability_status = @DisabilityStatus,
                organ_donor = @OrganDonor, emergency_contact_name = @EmergencyContactName,
                emergency_contact_relation = @EmergencyContactRelation,
                emergency_contact_mobile = @EmergencyContactMobile,
                insurance_provider_id = @InsuranceProviderId, policy_number = @PolicyNumber,
                valid_from = @ValidFrom, valid_to = @ValidTo, status = @Status,
                updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";

        var rows = await connection.ExecuteAsync(sql, patient);
        return rows > 0;
    }

    public override async Task<Patient?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, uhid as UHID, 
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            gender as Gender, date_of_birth as DateOfBirth, blood_group as BloodGroup,
            marital_status as MaritalStatus, mobile_number as MobileNumber,
            alternate_mobile as AlternateMobile, email as Email, whatsapp_number as WhatsAppNumber,
            address_line1 as AddressLine1, address_line2 as AddressLine2, city as City,
            state as State, pincode as Pincode, country as Country,
            allergies_summary as AllergiesSummary, chronic_conditions as ChronicConditions,
            current_medications as CurrentMedications, disability_status as DisabilityStatus,
            organ_donor as OrganDonor, emergency_contact_name as EmergencyContactName,
            emergency_contact_relation as EmergencyContactRelation,
            emergency_contact_mobile as EmergencyContactMobile,
            insurance_provider_id as InsuranceProviderId, policy_number as PolicyNumber,
            valid_from as ValidFrom, valid_to as ValidTo,
            registration_date as RegistrationDate, registered_by as RegisteredBy,
            status as Status, visit_count as VisitCount,
            created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM patients WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Patient>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<Patient?> GetByUHIDAsync(string uhid, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, uhid as UHID, 
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            gender as Gender, date_of_birth as DateOfBirth, blood_group as BloodGroup,
            marital_status as MaritalStatus, mobile_number as MobileNumber,
            alternate_mobile as AlternateMobile, email as Email, whatsapp_number as WhatsAppNumber,
            address_line1 as AddressLine1, address_line2 as AddressLine2, city as City,
            state as State, pincode as Pincode, country as Country,
            allergies_summary as AllergiesSummary, chronic_conditions as ChronicConditions,
            current_medications as CurrentMedications, disability_status as DisabilityStatus,
            organ_donor as OrganDonor, emergency_contact_name as EmergencyContactName,
            emergency_contact_relation as EmergencyContactRelation,
            emergency_contact_mobile as EmergencyContactMobile,
            insurance_provider_id as InsuranceProviderId, policy_number as PolicyNumber,
            valid_from as ValidFrom, valid_to as ValidTo,
            registration_date as RegistrationDate, registered_by as RegisteredBy,
            status as Status, visit_count as VisitCount,
            created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM patients WHERE uhid = @UHID AND tenant_id = @TenantId AND is_deleted = false";
        return await connection.QueryFirstOrDefaultAsync<Patient>(sql, new { UHID = uhid, TenantId = tenantId });
    }

    public async Task<PagedResult<Patient>> SearchAsync(PatientSearchRequest request, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var whereClause = "WHERE tenant_id = @TenantId AND is_deleted = false";
        var parameters = new DynamicParameters();
        parameters.Add("TenantId", tenantId);

        if (!string.IsNullOrEmpty(request.UHID))
        {
            whereClause += " AND uhid = @UHID";
            parameters.Add("UHID", request.UHID);
        }

        if (!string.IsNullOrEmpty(request.MobileNumber))
        {
            whereClause += " AND mobile_number = @MobileNumber";
            parameters.Add("MobileNumber", request.MobileNumber);
        }

        if (!string.IsNullOrEmpty(request.PolicyNumber))
        {
            whereClause += " AND policy_number = @PolicyNumber";
            parameters.Add("PolicyNumber", request.PolicyNumber);
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            whereClause += " AND status = @Status";
            parameters.Add("Status", request.Status);
        }

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            whereClause += @" AND (
                first_name ILIKE @SearchTerm 
                OR last_name ILIKE @SearchTerm 
                OR uhid ILIKE @SearchTerm
                OR mobile_number ILIKE @SearchTerm
            )";
            parameters.Add("SearchTerm", $"%{request.SearchTerm}%");
        }

        var offset = (request.PageNumber - 1) * request.PageSize;
        var orderBy = $"ORDER BY {request.SortBy} {request.SortOrder}";

        var sql = $@"SELECT 
            id as Id, tenant_id as TenantId, uhid as UHID, 
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            gender as Gender, date_of_birth as DateOfBirth, blood_group as BloodGroup,
            marital_status as MaritalStatus, mobile_number as MobileNumber,
            alternate_mobile as AlternateMobile, email as Email, whatsapp_number as WhatsAppNumber,
            address_line1 as AddressLine1, address_line2 as AddressLine2, city as City,
            state as State, pincode as Pincode, country as Country,
            allergies_summary as AllergiesSummary, chronic_conditions as ChronicConditions,
            current_medications as CurrentMedications, disability_status as DisabilityStatus,
            organ_donor as OrganDonor, emergency_contact_name as EmergencyContactName,
            emergency_contact_relation as EmergencyContactRelation,
            emergency_contact_mobile as EmergencyContactMobile,
            insurance_provider_id as InsuranceProviderId, policy_number as PolicyNumber,
            valid_from as ValidFrom, valid_to as ValidTo,
            registration_date as RegistrationDate, registered_by as RegisteredBy,
            status as Status, visit_count as VisitCount,
            created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM patients {whereClause} {orderBy} LIMIT @PageSize OFFSET @Offset";
        var countSql = $"SELECT COUNT(*) FROM patients {whereClause}";

        parameters.Add("PageSize", request.PageSize);
        parameters.Add("Offset", offset);

        var items = await connection.QueryAsync<Patient>(sql, parameters);
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new PagedResult<Patient>
        {
            Items = items.ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<string> GenerateUHIDAsync(Guid tenantId, string tenantCode)
    {
        using var connection = CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            var year = DateTime.UtcNow.Year;
            
            var seqSql = @"
                INSERT INTO patient_sequences (id, tenant_id, tenant_code, year, last_sequence, created_at, is_deleted)
                VALUES (uuid_generate_v4(), @TenantId, @TenantCode, @Year, 1, NOW(), false)
                ON CONFLICT (tenant_id, year) 
                DO UPDATE SET 
                    last_sequence = patient_sequences.last_sequence + 1,
                    updated_at = NOW()
                RETURNING last_sequence";
            
            var sequence = await connection.ExecuteScalarAsync<int>(seqSql, new { TenantId = tenantId, TenantCode = tenantCode, Year = year }, transaction);
            
            transaction.Commit();
            
            return $"PAT-{tenantCode}-{year}-{sequence:D6}";
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<List<Patient>> CheckDuplicatesAsync(Guid tenantId, string mobileNumber, string firstName, string lastName, DateTime dateOfBirth)
    {
        using var connection = CreateConnection();
        var sql = @"SELECT 
            id as Id, tenant_id as TenantId, uhid as UHID, 
            first_name as FirstName, middle_name as MiddleName, last_name as LastName,
            gender as Gender, date_of_birth as DateOfBirth, blood_group as BloodGroup,
            marital_status as MaritalStatus, mobile_number as MobileNumber,
            alternate_mobile as AlternateMobile, email as Email, whatsapp_number as WhatsAppNumber,
            address_line1 as AddressLine1, address_line2 as AddressLine2, city as City,
            state as State, pincode as Pincode, country as Country,
            allergies_summary as AllergiesSummary, chronic_conditions as ChronicConditions,
            current_medications as CurrentMedications, disability_status as DisabilityStatus,
            organ_donor as OrganDonor, emergency_contact_name as EmergencyContactName,
            emergency_contact_relation as EmergencyContactRelation,
            emergency_contact_mobile as EmergencyContactMobile,
            insurance_provider_id as InsuranceProviderId, policy_number as PolicyNumber,
            valid_from as ValidFrom, valid_to as ValidTo,
            registration_date as RegistrationDate, registered_by as RegisteredBy,
            status as Status, visit_count as VisitCount,
            created_at as CreatedAt, created_by as CreatedBy,
            updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM patients
            WHERE tenant_id = @TenantId
                AND is_deleted = false
                AND (
                    mobile_number = @MobileNumber
                    OR (
                        LOWER(first_name) = LOWER(@FirstName)
                        AND LOWER(last_name) = LOWER(@LastName)
                        AND date_of_birth = @DateOfBirth
                    )
                )
            LIMIT 5";
        
        var result = await connection.QueryAsync<Patient>(sql, new 
        { 
            TenantId = tenantId, 
            MobileNumber = mobileNumber, 
            FirstName = firstName, 
            LastName = lastName, 
            DateOfBirth = dateOfBirth 
        });
        
        return result.ToList();
    }

    public async Task<bool> MergePatientsAsync(Guid primaryId, Guid secondaryId, Guid tenantId, Guid mergedBy)
    {
        using var connection = CreateConnection();
        using var transaction = connection.BeginTransaction();
        
        try
        {
            // Update secondary patient to merged status
            var sql = @"
                UPDATE patients 
                SET status = 'Merged', 
                    is_deleted = true, 
                    updated_at = @UpdatedAt, 
                    updated_by = @MergedBy
                WHERE id = @SecondaryId AND tenant_id = @TenantId";
            
            await connection.ExecuteAsync(sql, new 
            { 
                SecondaryId = secondaryId, 
                TenantId = tenantId, 
                UpdatedAt = DateTime.UtcNow, 
                MergedBy = mergedBy 
            }, transaction);

            // Increment visit count of primary patient
            await connection.ExecuteAsync(
                "UPDATE patients SET visit_count = visit_count + (SELECT visit_count FROM patients WHERE id = @SecondaryId) WHERE id = @PrimaryId",
                new { PrimaryId = primaryId, SecondaryId = secondaryId },
                transaction
            );

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            return false;
        }
    }

    public async Task<PatientStatsResponse> GetStatsAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                COUNT(*) FILTER (WHERE is_deleted = false) as TotalPatients,
                COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as ActivePatients,
                COUNT(*) FILTER (WHERE status = 'Inactive' AND is_deleted = false) as InactivePatients,
                COUNT(*) FILTER (WHERE DATE(registration_date) = CURRENT_DATE AND is_deleted = false) as TodayRegistrations,
                COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE) AND is_deleted = false) as ThisMonthRegistrations
            FROM patients
            WHERE tenant_id = @TenantId";

        return await connection.QueryFirstOrDefaultAsync<PatientStatsResponse>(sql, new { TenantId = tenantId }) 
            ?? new PatientStatsResponse();
    }

    public async Task<bool> IncrementVisitCountAsync(Guid patientId, Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "UPDATE patients SET visit_count = visit_count + 1 WHERE id = @PatientId AND tenant_id = @TenantId";
        var rows = await connection.ExecuteAsync(sql, new { PatientId = patientId, TenantId = tenantId });
        return rows > 0;
    }
}

public interface IInsuranceProviderRepository
{
    Task<Guid> CreateAsync(PatientInsurance provider);
    Task<PatientInsurance?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<PatientInsurance>> GetAllAsync(Guid tenantId);
    Task<bool> UpdateAsync(PatientInsurance provider);
}

public class InsuranceProviderRepository : BaseRepository<PatientInsurance>, IInsuranceProviderRepository
{
    protected override string TableName => "patient_insurance_providers";

    public InsuranceProviderRepository(string connectionString) : base(connectionString) { }

    public new async Task<List<PatientInsurance>> GetAllAsync(Guid tenantId)
    {
        using var connection = CreateConnection();
        var sql = "SELECT * FROM patient_insurance_providers WHERE tenant_id = @TenantId AND is_deleted = false ORDER BY provider_name";
        var result = await connection.QueryAsync<PatientInsurance>(sql, new { TenantId = tenantId });
        return result.ToList();
    }
}
