using EMRService.Domain;

namespace EMRService.Repositories;

public interface IEncounterRepository
{
    Task<Encounter> CreateAsync(Encounter encounter);
    Task<Encounter?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<Encounter>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
    Task<bool> CloseEncounterAsync(Guid id, Guid tenantId, Guid userId);
    Task<string> GenerateEncounterNumberAsync(Guid tenantId, string tenantCode);
}

public interface IClinicalNoteRepository
{
    Task<ClinicalNote> CreateAsync(ClinicalNote note);
    Task<List<ClinicalNote>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId);
}

public interface IDiagnosisRepository
{
    Task<Diagnosis> CreateAsync(Diagnosis diagnosis);
    Task<List<Diagnosis>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId);
    Task<bool> HasPrimaryDiagnosisAsync(Guid encounterId, Guid tenantId);
}

public interface IVitalRepository
{
    Task<Vital> CreateAsync(Vital vital);
    Task<List<Vital>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId);
}

public interface IAllergyRepository
{
    Task<Allergy> CreateAsync(Allergy allergy);
    Task<List<Allergy>> GetByPatientIdAsync(Guid patientId, Guid tenantId);
}

public interface IProcedureRepository
{
    Task<Procedure> CreateAsync(Procedure procedure);
    Task<List<Procedure>> GetByEncounterIdAsync(Guid encounterId, Guid tenantId);
}
