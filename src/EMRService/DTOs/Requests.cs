namespace EMRService.DTOs;

public record CreateEncounterRequest(
    Guid PatientId,
    Guid DoctorId,
    string EncounterType,
    DateTime EncounterDate,
    string? ChiefComplaint
);

public record CreateClinicalNoteRequest(
    string NoteType,
    string? Subjective,
    string? Objective,
    string? Assessment,
    string? Plan
);

public record CreateDiagnosisRequest(
    string ICD10Code,
    string DiagnosisName,
    string DiagnosisType,
    string? Notes
);

public record CreateVitalRequest(
    decimal? Temperature,
    int? PulseRate,
    int? RespiratoryRate,
    string? BloodPressure,
    decimal? Height,
    decimal? Weight,
    int? OxygenSaturation,
    DateTime RecordedAt
);

public record CreateAllergyRequest(
    string AllergyType,
    string AllergenName,
    string Severity,
    string? Reaction,
    DateTime? OnsetDate
);

public record CreateProcedureRequest(
    string ProcedureCode,
    string ProcedureName,
    DateTime ProcedureDate,
    string? Notes,
    string Status
);

public record ApiResponse<T>(
    bool Success,
    string Message,
    T? Data,
    List<string>? Errors = null
);
