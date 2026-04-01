using Dapper;
using Npgsql;
using PatientService.Domain;
using Shared.Common.Helpers;

namespace PatientService.Repositories;

// =====================================================
// PATIENT ALLERGY REPOSITORY
// =====================================================

public interface IPatientAllergyRepository
{
    Task<List<PatientAllergy>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<PatientAllergy?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<PatientAllergy>> GetCriticalAllergiesAsync(Guid patientId, Guid tenantId);
    Task<Guid> CreateAsync(PatientAllergy allergy);
    Task<bool> UpdateAsync(PatientAllergy allergy);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}

public class PatientAllergyRepository : BaseRepository<PatientAllergy>, IPatientAllergyRepository
{
    protected override string TableName => "patient_allergies";

    public PatientAllergyRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientAllergy>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                allergen_type as AllergenType,
                allergen_name as AllergenName,
                reaction as Reaction,
                severity as Severity,
                onset_date as OnsetDate,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_allergies
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
            ORDER BY 
                CASE severity 
                    WHEN 'Life-threatening' THEN 1
                    WHEN 'Severe' THEN 2
                    WHEN 'Moderate' THEN 3
                    WHEN 'Mild' THEN 4
                END,
                created_at DESC";

        var allergies = await conn.QueryAsync<PatientAllergy>(sql, new { PatientId = patientId, TenantId = tenantId });
        return allergies.ToList();
    }

    public override async Task<PatientAllergy?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                allergen_type as AllergenType,
                allergen_name as AllergenName,
                reaction as Reaction,
                severity as Severity,
                onset_date as OnsetDate,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_allergies
            WHERE id = @Id 
              AND tenant_id = @TenantId 
              AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PatientAllergy>(sql, new { Id = id, TenantId = tenantId });
    }

    public async Task<List<PatientAllergy>> GetCriticalAllergiesAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                allergen_type as AllergenType,
                allergen_name as AllergenName,
                reaction as Reaction,
                severity as Severity,
                onset_date as OnsetDate,
                notes as Notes,
                created_at as CreatedAt
            FROM patient_allergies
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
              AND severity IN ('Severe', 'Life-threatening')
            ORDER BY 
                CASE severity 
                    WHEN 'Life-threatening' THEN 1
                    WHEN 'Severe' THEN 2
                END";

        var allergies = await conn.QueryAsync<PatientAllergy>(sql, new { PatientId = patientId, TenantId = tenantId });
        return allergies.ToList();
    }
}

// =====================================================
// CHRONIC CONDITION REPOSITORY
// =====================================================

public interface IPatientChronicConditionRepository
{
    Task<List<PatientChronicCondition>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<List<PatientChronicCondition>> GetActiveConditionsAsync(Guid patientId, Guid tenantId);
    Task<PatientChronicCondition?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(PatientChronicCondition condition);
    Task<bool> UpdateAsync(PatientChronicCondition condition);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}

public class PatientChronicConditionRepository : BaseRepository<PatientChronicCondition>, IPatientChronicConditionRepository
{
    protected override string TableName => "patient_chronic_conditions";

    public PatientChronicConditionRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientChronicCondition>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                condition_name as ConditionName,
                icd10_code as Icd10Code,
                diagnosed_date as DiagnosedDate,
                status as Status,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_chronic_conditions
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
            ORDER BY 
                CASE status 
                    WHEN 'Active' THEN 1
                    WHEN 'Managed' THEN 2
                    WHEN 'Recurrent' THEN 3
                    WHEN 'Resolved' THEN 4
                END,
                diagnosed_date DESC";

        var conditions = await conn.QueryAsync<PatientChronicCondition>(sql, new { PatientId = patientId, TenantId = tenantId });
        return conditions.ToList();
    }

    public async Task<List<PatientChronicCondition>> GetActiveConditionsAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                condition_name as ConditionName,
                icd10_code as Icd10Code,
                diagnosed_date as DiagnosedDate,
                status as Status,
                notes as Notes,
                created_at as CreatedAt
            FROM patient_chronic_conditions
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
              AND status = 'Active'
            ORDER BY diagnosed_date DESC";

        var conditions = await conn.QueryAsync<PatientChronicCondition>(sql, new { PatientId = patientId, TenantId = tenantId });
        return conditions.ToList();
    }

    public override async Task<PatientChronicCondition?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                condition_name as ConditionName,
                icd10_code as Icd10Code,
                diagnosed_date as DiagnosedDate,
                status as Status,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_chronic_conditions
            WHERE id = @Id 
              AND tenant_id = @TenantId 
              AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PatientChronicCondition>(sql, new { Id = id, TenantId = tenantId });
    }
}

// =====================================================
// MEDICATION HISTORY REPOSITORY
// =====================================================

public interface IPatientMedicationHistoryRepository
{
    Task<List<PatientMedicationHistory>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<List<PatientMedicationHistory>> GetCurrentMedicationsAsync(Guid patientId, Guid tenantId);
    Task<PatientMedicationHistory?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(PatientMedicationHistory medication);
    Task<bool> UpdateAsync(PatientMedicationHistory medication);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}

public class PatientMedicationHistoryRepository : BaseRepository<PatientMedicationHistory>, IPatientMedicationHistoryRepository
{
    protected override string TableName => "patient_medication_history";

    public PatientMedicationHistoryRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientMedicationHistory>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                medication_name as MedicationName,
                generic_name as GenericName,
                dosage as Dosage,
                frequency as Frequency,
                route as Route,
                start_date as StartDate,
                end_date as EndDate,
                is_current as IsCurrent,
                prescribed_by as PrescribedBy,
                indication as Indication,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_medication_history
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
            ORDER BY is_current DESC, start_date DESC";

        var medications = await conn.QueryAsync<PatientMedicationHistory>(sql, new { PatientId = patientId, TenantId = tenantId });
        return medications.ToList();
    }

    public async Task<List<PatientMedicationHistory>> GetCurrentMedicationsAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                medication_name as MedicationName,
                generic_name as GenericName,
                dosage as Dosage,
                frequency as Frequency,
                route as Route,
                start_date as StartDate,
                end_date as EndDate,
                is_current as IsCurrent,
                prescribed_by as PrescribedBy,
                indication as Indication,
                notes as Notes,
                created_at as CreatedAt
            FROM patient_medication_history
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
              AND is_current = true
            ORDER BY start_date DESC";

        var medications = await conn.QueryAsync<PatientMedicationHistory>(sql, new { PatientId = patientId, TenantId = tenantId });
        return medications.ToList();
    }

    public override async Task<PatientMedicationHistory?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                medication_name as MedicationName,
                generic_name as GenericName,
                dosage as Dosage,
                frequency as Frequency,
                route as Route,
                start_date as StartDate,
                end_date as EndDate,
                is_current as IsCurrent,
                prescribed_by as PrescribedBy,
                indication as Indication,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_medication_history
            WHERE id = @Id 
              AND tenant_id = @TenantId 
              AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PatientMedicationHistory>(sql, new { Id = id, TenantId = tenantId });
    }
}

// =====================================================
// IMMUNIZATION REPOSITORY
// =====================================================

public interface IPatientImmunizationRepository
{
    Task<List<PatientImmunization>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<List<PatientImmunization>> GetDueImmunizationsAsync(Guid patientId, Guid tenantId);
    Task<PatientImmunization?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(PatientImmunization immunization);
    Task<bool> UpdateAsync(PatientImmunization immunization);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}

public class PatientImmunizationRepository : BaseRepository<PatientImmunization>, IPatientImmunizationRepository
{
    protected override string TableName => "patient_immunizations";

    public PatientImmunizationRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientImmunization>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                vaccine_name as VaccineName,
                vaccine_code as VaccineCode,
                dose_number as DoseNumber,
                administration_date as AdministrationDate,
                administered_by as AdministeredBy,
                site as Site,
                route as Route,
                lot_number as LotNumber,
                manufacturer as Manufacturer,
                expiry_date as ExpiryDate,
                next_dose_due_date as NextDoseDueDate,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_immunizations
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
            ORDER BY administration_date DESC";

        var immunizations = await conn.QueryAsync<PatientImmunization>(sql, new { PatientId = patientId, TenantId = tenantId });
        return immunizations.ToList();
    }

    public async Task<List<PatientImmunization>> GetDueImmunizationsAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                vaccine_name as VaccineName,
                vaccine_code as VaccineCode,
                dose_number as DoseNumber,
                administration_date as AdministrationDate,
                next_dose_due_date as NextDoseDueDate,
                notes as Notes,
                created_at as CreatedAt
            FROM patient_immunizations
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
              AND next_dose_due_date IS NOT NULL
              AND next_dose_due_date <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY next_dose_due_date ASC";

        var immunizations = await conn.QueryAsync<PatientImmunization>(sql, new { PatientId = patientId, TenantId = tenantId });
        return immunizations.ToList();
    }

    public override async Task<PatientImmunization?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                vaccine_name as VaccineName,
                vaccine_code as VaccineCode,
                dose_number as DoseNumber,
                administration_date as AdministrationDate,
                administered_by as AdministeredBy,
                site as Site,
                route as Route,
                lot_number as LotNumber,
                manufacturer as Manufacturer,
                expiry_date as ExpiryDate,
                next_dose_due_date as NextDoseDueDate,
                notes as Notes,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_immunizations
            WHERE id = @Id 
              AND tenant_id = @TenantId 
              AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PatientImmunization>(sql, new { Id = id, TenantId = tenantId });
    }
}

// =====================================================
// DOCUMENT REPOSITORY
// =====================================================

public interface IPatientDocumentRepository
{
    Task<List<PatientDocument>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<List<PatientDocument>> GetByTypeAsync(Guid patientId, Guid tenantId, string documentType);
    Task<PatientDocument?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> CreateAsync(PatientDocument document);
    Task<bool> UpdateAsync(PatientDocument document);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}

public class PatientDocumentRepository : BaseRepository<PatientDocument>, IPatientDocumentRepository
{
    protected override string TableName => "patient_documents";

    public PatientDocumentRepository(string connectionString) : base(connectionString) { }

    public async Task<List<PatientDocument>> GetByPatientIdAsync(Guid patientId, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                document_type as DocumentType,
                document_name as DocumentName,
                file_path as FilePath,
                file_size_kb as FileSizeKb,
                mime_type as MimeType,
                uploaded_date as UploadedDate,
                description as Description,
                is_confidential as IsConfidential,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_documents
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND is_deleted = false
            ORDER BY uploaded_date DESC";

        var documents = await conn.QueryAsync<PatientDocument>(sql, new { PatientId = patientId, TenantId = tenantId });
        return documents.ToList();
    }

    public async Task<List<PatientDocument>> GetByTypeAsync(Guid patientId, Guid tenantId, string documentType)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                document_type as DocumentType,
                document_name as DocumentName,
                file_path as FilePath,
                file_size_kb as FileSizeKb,
                mime_type as MimeType,
                uploaded_date as UploadedDate,
                description as Description,
                is_confidential as IsConfidential,
                created_at as CreatedAt
            FROM patient_documents
            WHERE patient_id = @PatientId 
              AND tenant_id = @TenantId 
              AND document_type = @DocumentType
              AND is_deleted = false
            ORDER BY uploaded_date DESC";

        var documents = await conn.QueryAsync<PatientDocument>(sql, new { PatientId = patientId, TenantId = tenantId, DocumentType = documentType });
        return documents.ToList();
    }

    public override async Task<PatientDocument?> GetByIdAsync(Guid id, Guid tenantId)
    {
        using var conn = CreateConnection();
        
        var sql = @"
            SELECT 
                id as Id,
                tenant_id as TenantId,
                patient_id as PatientId,
                document_type as DocumentType,
                document_name as DocumentName,
                file_path as FilePath,
                file_size_kb as FileSizeKb,
                mime_type as MimeType,
                uploaded_date as UploadedDate,
                description as Description,
                is_confidential as IsConfidential,
                created_at as CreatedAt,
                created_by as CreatedBy,
                updated_at as UpdatedAt,
                updated_by as UpdatedBy,
                is_deleted as IsDeleted
            FROM patient_documents
            WHERE id = @Id 
              AND tenant_id = @TenantId 
              AND is_deleted = false";

        return await conn.QueryFirstOrDefaultAsync<PatientDocument>(sql, new { Id = id, TenantId = tenantId });
    }
}
