using EMRService.Domain;
using EMRService.DTOs;
using EMRService.Repositories;

namespace EMRService.Application;

public interface IEMRService
{
    Task<Encounter> CreateEncounterAsync(CreateEncounterRequest request, Guid tenantId, string tenantCode, Guid userId);
    Task<Encounter?> GetEncounterAsync(Guid id, Guid tenantId);
    Task<List<Encounter>> GetPatientEncountersAsync(Guid patientId, Guid tenantId);
    Task<bool> CloseEncounterAsync(Guid id, Guid tenantId, Guid userId, Guid doctorId);
    Task<ClinicalNote> AddClinicalNoteAsync(Guid encounterId, CreateClinicalNoteRequest request, Guid tenantId, Guid userId, Guid doctorId);
    Task<List<ClinicalNote>> GetClinicalNotesAsync(Guid encounterId, Guid tenantId);
    Task<Vital> AddVitalAsync(Guid encounterId, CreateVitalRequest request, Guid tenantId, Guid userId);
    Task<List<Vital>> GetVitalsAsync(Guid encounterId, Guid tenantId);
    Task<Diagnosis> AddDiagnosisAsync(Guid encounterId, CreateDiagnosisRequest request, Guid tenantId, Guid userId);
    Task<List<Diagnosis>> GetDiagnosesAsync(Guid encounterId, Guid tenantId);
    Task<Allergy> AddAllergyAsync(Guid patientId, CreateAllergyRequest request, Guid tenantId, Guid userId);
    Task<List<Allergy>> GetAllergiesAsync(Guid patientId, Guid tenantId);
    Task<Procedure> AddProcedureAsync(Guid encounterId, CreateProcedureRequest request, Guid tenantId, Guid userId);
    Task<List<Procedure>> GetProceduresAsync(Guid encounterId, Guid tenantId);
}

public class EMRService : IEMRService
{
    private readonly IEncounterRepository _encounterRepo;
    private readonly IClinicalNoteRepository _noteRepo;
    private readonly IDiagnosisRepository _diagnosisRepo;
    private readonly IVitalRepository _vitalRepo;
    private readonly IAllergyRepository _allergyRepo;
    private readonly IProcedureRepository _procedureRepo;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<EMRService> _logger;

    public EMRService(
        IEncounterRepository encounterRepo,
        IClinicalNoteRepository noteRepo,
        IDiagnosisRepository diagnosisRepo,
        IVitalRepository vitalRepo,
        IAllergyRepository allergyRepo,
        IProcedureRepository procedureRepo,
        IEventPublisher eventPublisher,
        ILogger<EMRService> logger)
    {
        _encounterRepo = encounterRepo;
        _noteRepo = noteRepo;
        _diagnosisRepo = diagnosisRepo;
        _vitalRepo = vitalRepo;
        _allergyRepo = allergyRepo;
        _procedureRepo = procedureRepo;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task<Encounter> CreateEncounterAsync(CreateEncounterRequest request, Guid tenantId, string tenantCode, Guid userId)
    {
        var encounterNumber = await _encounterRepo.GenerateEncounterNumberAsync(tenantId, tenantCode);

        var encounter = new Encounter
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EncounterNumber = encounterNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            EncounterType = request.EncounterType,
            EncounterDate = request.EncounterDate,
            Status = "Open",
            ChiefComplaint = request.ChiefComplaint,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _encounterRepo.CreateAsync(encounter);
    }

    public async Task<Encounter?> GetEncounterAsync(Guid id, Guid tenantId)
    {
        return await _encounterRepo.GetByIdAsync(id, tenantId);
    }

    public async Task<List<Encounter>> GetPatientEncountersAsync(Guid patientId, Guid tenantId)
    {
        return await _encounterRepo.GetByPatientIdAsync(patientId, tenantId);
    }

    public async Task<bool> CloseEncounterAsync(Guid id, Guid tenantId, Guid userId, Guid doctorId)
    {
        var encounter = await _encounterRepo.GetByIdAsync(id, tenantId);
        if (encounter == null) throw new Exception("Encounter not found");
        if (encounter.Status == "Closed") throw new Exception("Encounter already closed");
        if (encounter.DoctorId != doctorId) throw new Exception("Only assigned doctor can close encounter");

        var hasPrimaryDiagnosis = await _diagnosisRepo.HasPrimaryDiagnosisAsync(id, tenantId);
        if (!hasPrimaryDiagnosis) throw new Exception("At least one primary diagnosis required");

        var closed = await _encounterRepo.CloseEncounterAsync(id, tenantId, userId);
        
        if (closed)
        {
            await _eventPublisher.PublishAsync("encounter.closed", new EncounterClosedEvent(
                id, encounter.PatientId, encounter.DoctorId, tenantId, DateTime.UtcNow
            ));
        }

        return closed;
    }

    public async Task<ClinicalNote> AddClinicalNoteAsync(Guid encounterId, CreateClinicalNoteRequest request, Guid tenantId, Guid userId, Guid doctorId)
    {
        var encounter = await _encounterRepo.GetByIdAsync(encounterId, tenantId);
        if (encounter == null) throw new Exception("Encounter not found");
        if (encounter.Status == "Closed") throw new Exception("Cannot modify closed encounter");
        if (encounter.DoctorId != doctorId) throw new Exception("Only assigned doctor can add notes");

        var note = new ClinicalNote
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EncounterId = encounterId,
            NoteType = request.NoteType,
            Subjective = request.Subjective,
            Objective = request.Objective,
            Assessment = request.Assessment,
            Plan = request.Plan,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _noteRepo.CreateAsync(note);
    }

    public async Task<List<ClinicalNote>> GetClinicalNotesAsync(Guid encounterId, Guid tenantId)
    {
        return await _noteRepo.GetByEncounterIdAsync(encounterId, tenantId);
    }

    public async Task<Vital> AddVitalAsync(Guid encounterId, CreateVitalRequest request, Guid tenantId, Guid userId)
    {
        var encounter = await _encounterRepo.GetByIdAsync(encounterId, tenantId);
        if (encounter == null) throw new Exception("Encounter not found");
        if (encounter.Status == "Closed") throw new Exception("Cannot modify closed encounter");

        decimal? bmi = null;
        if (request.Height.HasValue && request.Weight.HasValue && request.Height > 0)
        {
            var heightInMeters = request.Height.Value / 100;
            bmi = Math.Round(request.Weight.Value / (heightInMeters * heightInMeters), 2);
        }

        var vital = new Vital
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EncounterId = encounterId,
            Temperature = request.Temperature,
            PulseRate = request.PulseRate,
            RespiratoryRate = request.RespiratoryRate,
            BloodPressure = request.BloodPressure,
            Height = request.Height,
            Weight = request.Weight,
            BMI = bmi,
            OxygenSaturation = request.OxygenSaturation,
            RecordedAt = request.RecordedAt,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _vitalRepo.CreateAsync(vital);
    }

    public async Task<List<Vital>> GetVitalsAsync(Guid encounterId, Guid tenantId)
    {
        return await _vitalRepo.GetByEncounterIdAsync(encounterId, tenantId);
    }

    public async Task<Diagnosis> AddDiagnosisAsync(Guid encounterId, CreateDiagnosisRequest request, Guid tenantId, Guid userId)
    {
        var encounter = await _encounterRepo.GetByIdAsync(encounterId, tenantId);
        if (encounter == null) throw new Exception("Encounter not found");
        if (encounter.Status == "Closed") throw new Exception("Cannot modify closed encounter");

        var diagnosis = new Diagnosis
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EncounterId = encounterId,
            ICD10Code = request.ICD10Code,
            DiagnosisName = request.DiagnosisName,
            DiagnosisType = request.DiagnosisType,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _diagnosisRepo.CreateAsync(diagnosis);
    }

    public async Task<List<Diagnosis>> GetDiagnosesAsync(Guid encounterId, Guid tenantId)
    {
        return await _diagnosisRepo.GetByEncounterIdAsync(encounterId, tenantId);
    }

    public async Task<Allergy> AddAllergyAsync(Guid patientId, CreateAllergyRequest request, Guid tenantId, Guid userId)
    {
        var allergy = new Allergy
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            AllergyType = request.AllergyType,
            AllergenName = request.AllergenName,
            Severity = request.Severity,
            Reaction = request.Reaction,
            OnsetDate = request.OnsetDate,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _allergyRepo.CreateAsync(allergy);
    }

    public async Task<List<Allergy>> GetAllergiesAsync(Guid patientId, Guid tenantId)
    {
        return await _allergyRepo.GetByPatientIdAsync(patientId, tenantId);
    }

    public async Task<Procedure> AddProcedureAsync(Guid encounterId, CreateProcedureRequest request, Guid tenantId, Guid userId)
    {
        var encounter = await _encounterRepo.GetByIdAsync(encounterId, tenantId);
        if (encounter == null) throw new Exception("Encounter not found");
        if (encounter.Status == "Closed") throw new Exception("Cannot modify closed encounter");

        var procedure = new Procedure
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EncounterId = encounterId,
            ProcedureCode = request.ProcedureCode,
            ProcedureName = request.ProcedureName,
            ProcedureDate = request.ProcedureDate,
            Notes = request.Notes,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsDeleted = false
        };

        return await _procedureRepo.CreateAsync(procedure);
    }

    public async Task<List<Procedure>> GetProceduresAsync(Guid encounterId, Guid tenantId)
    {
        return await _procedureRepo.GetByEncounterIdAsync(encounterId, tenantId);
    }
}
