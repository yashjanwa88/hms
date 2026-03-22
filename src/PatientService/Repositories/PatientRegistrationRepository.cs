using Dapper;
using PatientService.Domain;
using PatientService.DTOs;
using Shared.Common.Helpers;

namespace PatientService.Repositories;

public interface IPatientRegistrationRepository
{
    Task<Guid> RegisterPatientAsync(Patient patient);
    Task<string> GenerateUHIDAsync(Guid tenantId, string tenantCode);
    Task<List<DuplicatePatientInfo>> CheckDuplicatesAsync(Guid tenantId, string mobileNumber, string firstName, string lastName, DateTime dateOfBirth);
    Task<List<QuickSearchResponse>> QuickSearchAsync(Guid tenantId, string searchTerm, int maxResults);
    Task<bool> UpdateSearchIndexAsync(Patient patient);
    Task<Patient?> GetByUHIDAsync(string uhid, Guid tenantId);
}

public class PatientRegistrationRepository : BaseRepository<Patient>, IPatientRegistrationRepository
{
    protected override string TableName => "patients";

    public PatientRegistrationRepository(string connectionString) : base(connectionString) { }

    public async Task<Guid> RegisterPatientAsync(Patient patient)
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
                consent_terms_accepted, consent_privacy_accepted, consent_health_data_sharing, consent_recorded_at,
                registration_date, registered_by, status, visit_count, created_at, created_by, is_deleted
            ) VALUES (
                @Id, @TenantId, @UHID, @FirstName, @MiddleName, @LastName, @Gender, @DateOfBirth,
                @BloodGroup, @MaritalStatus, @MobileNumber, @AlternateMobile, @Email, @WhatsAppNumber,
                @AddressLine1, @AddressLine2, @City, @State, @Pincode, @Country,
                @AllergiesSummary, @ChronicConditions, @CurrentMedications, @DisabilityStatus, @OrganDonor,
                @EmergencyContactName, @EmergencyContactRelation, @EmergencyContactMobile,
                @InsuranceProviderId, @PolicyNumber, @ValidFrom, @ValidTo,
                @ConsentTermsAccepted, @ConsentPrivacyAccepted, @ConsentHealthDataSharing, @ConsentRecordedAt,
                @RegistrationDate, @RegisteredBy, @Status, @VisitCount, @CreatedAt, @CreatedBy, @IsDeleted
            )";
        
        await connection.ExecuteAsync(sql, patient);
        
        // Update search index
        await UpdateSearchIndexAsync(patient);
        
        return patient.Id;
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
            
            var sequence = await connection.ExecuteScalarAsync<int>(seqSql, 
                new { TenantId = tenantId, TenantCode = tenantCode, Year = year }, 
                transaction);
            
            transaction.Commit();
            
            return $"PAT-{tenantCode}-{year}-{sequence:D6}";
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<List<DuplicatePatientInfo>> CheckDuplicatesAsync(
        Guid tenantId, string mobileNumber, string firstName, string lastName, DateTime dateOfBirth)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            WITH duplicate_check AS (
                SELECT 
                    id,
                    uhid,
                    CONCAT_WS(' ', first_name, middle_name, last_name) as full_name,
                    mobile_number,
                    date_of_birth,
                    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
                    CASE 
                        WHEN mobile_number = @MobileNumber THEN 100
                        WHEN alternate_mobile = @MobileNumber THEN 90
                        ELSE 0
                    END +
                    CASE 
                        WHEN LOWER(first_name) = LOWER(@FirstName) 
                         AND LOWER(last_name) = LOWER(@LastName) 
                         AND date_of_birth = @DateOfBirth THEN 100
                        WHEN LOWER(first_name) = LOWER(@FirstName) 
                         AND LOWER(last_name) = LOWER(@LastName) THEN 70
                        WHEN date_of_birth = @DateOfBirth THEN 50
                        ELSE 0
                    END as match_score,
                    CASE 
                        WHEN mobile_number = @MobileNumber THEN 'Exact Mobile Match'
                        WHEN alternate_mobile = @MobileNumber THEN 'Alternate Mobile Match'
                        WHEN LOWER(first_name) = LOWER(@FirstName) 
                         AND LOWER(last_name) = LOWER(@LastName) 
                         AND date_of_birth = @DateOfBirth THEN 'Name + DOB Match'
                        WHEN LOWER(first_name) = LOWER(@FirstName) 
                         AND LOWER(last_name) = LOWER(@LastName) THEN 'Name Match'
                        ELSE 'Partial Match'
                    END as match_reason
                FROM patients
                WHERE tenant_id = @TenantId
                    AND is_deleted = false
                    AND (
                        mobile_number = @MobileNumber
                        OR alternate_mobile = @MobileNumber
                        OR (
                            LOWER(first_name) = LOWER(@FirstName)
                            AND LOWER(last_name) = LOWER(@LastName)
                            AND date_of_birth = @DateOfBirth
                        )
                    )
            )
            SELECT 
                id as Id,
                uhid as UHID,
                full_name as FullName,
                mobile_number as MobileNumber,
                date_of_birth as DateOfBirth,
                age as Age,
                match_reason as MatchReason,
                match_score as MatchScore
            FROM duplicate_check
            WHERE match_score >= 50
            ORDER BY match_score DESC
            LIMIT 5";
        
        var result = await connection.QueryAsync<DuplicatePatientInfo>(sql, new 
        { 
            TenantId = tenantId, 
            MobileNumber = mobileNumber, 
            FirstName = firstName, 
            LastName = lastName, 
            DateOfBirth = dateOfBirth 
        });
        
        return result.ToList();
    }

    public async Task<List<QuickSearchResponse>> QuickSearchAsync(Guid tenantId, string searchTerm, int maxResults)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
                p.id as Id,
                p.uhid as UHID,
                CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) as FullName,
                p.mobile_number as MobileNumber,
                EXTRACT(YEAR FROM AGE(p.date_of_birth)) as Age,
                p.gender as Gender
            FROM patients p
            WHERE p.tenant_id = @TenantId
                AND p.is_deleted = false
                AND (
                    p.uhid ILIKE @SearchPattern
                    OR p.mobile_number LIKE @SearchPattern
                    OR CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) ILIKE @SearchPattern
                    OR p.email ILIKE @SearchPattern
                )
            ORDER BY 
                CASE 
                    WHEN p.uhid = @SearchTerm THEN 1
                    WHEN p.mobile_number = @SearchTerm THEN 2
                    ELSE 3
                END,
                p.created_at DESC
            LIMIT @MaxResults";
        
        var result = await connection.QueryAsync<QuickSearchResponse>(sql, new 
        { 
            TenantId = tenantId, 
            SearchTerm = searchTerm,
            SearchPattern = $"%{searchTerm}%",
            MaxResults = maxResults 
        });
        
        return result.ToList();
    }

    public async Task<bool> UpdateSearchIndexAsync(Patient patient)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            INSERT INTO patient_search_index (
                id, tenant_id, patient_id, uhid, mobile_number, alternate_mobile,
                email, full_name, date_of_birth, age, blood_group, city, pincode,
                search_text, last_updated, created_at, is_deleted
            ) VALUES (
                uuid_generate_v4(), @TenantId, @PatientId, @UHID, @MobileNumber, @AlternateMobile,
                @Email, @FullName, @DateOfBirth, @Age, @BloodGroup, @City, @Pincode,
                @SearchText, NOW(), NOW(), false
            )
            ON CONFLICT (patient_id) DO UPDATE SET
                uhid = EXCLUDED.uhid,
                mobile_number = EXCLUDED.mobile_number,
                alternate_mobile = EXCLUDED.alternate_mobile,
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                date_of_birth = EXCLUDED.date_of_birth,
                age = EXCLUDED.age,
                blood_group = EXCLUDED.blood_group,
                city = EXCLUDED.city,
                pincode = EXCLUDED.pincode,
                search_text = EXCLUDED.search_text,
                last_updated = NOW()";
        
        var fullName = $"{patient.FirstName} {patient.MiddleName} {patient.LastName}".Trim();
        var searchText = $"{patient.UHID} {fullName} {patient.MobileNumber} {patient.Email} {patient.City}".ToLower();
        
        var rows = await connection.ExecuteAsync(sql, new
        {
            patient.TenantId,
            PatientId = patient.Id,
            patient.UHID,
            patient.MobileNumber,
            patient.AlternateMobile,
            patient.Email,
            FullName = fullName,
            patient.DateOfBirth,
            Age = patient.Age,
            patient.BloodGroup,
            patient.City,
            patient.Pincode,
            SearchText = searchText
        });
        
        return rows > 0;
    }

    public async Task<Patient?> GetByUHIDAsync(string uhid, Guid tenantId)
    {
        using var connection = CreateConnection();
        
        var sql = @"
            SELECT 
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
                consent_terms_accepted as ConsentTermsAccepted, consent_privacy_accepted as ConsentPrivacyAccepted,
                consent_health_data_sharing as ConsentHealthDataSharing, consent_recorded_at as ConsentRecordedAt,
                registration_date as RegistrationDate, registered_by as RegisteredBy,
                status as Status, visit_count as VisitCount,
                created_at as CreatedAt, created_by as CreatedBy,
                updated_at as UpdatedAt, updated_by as UpdatedBy, is_deleted as IsDeleted
            FROM patients 
            WHERE uhid = @UHID AND tenant_id = @TenantId AND is_deleted = false";
        
        return await connection.QueryFirstOrDefaultAsync<Patient>(sql, new { UHID = uhid, TenantId = tenantId });
    }
}
