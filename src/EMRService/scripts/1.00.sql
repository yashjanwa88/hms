-- EMR Service Database Schema v1.00
-- PostgreSQL 16

-- Drop existing tables if they exist
DROP TABLE IF EXISTS procedures CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS vitals CASCADE;
DROP TABLE IF EXISTS diagnoses CASCADE;
DROP TABLE IF EXISTS clinical_notes CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS emr_sequences CASCADE;

-- EMR Sequences Table (for encounter number generation)
CREATE TABLE emr_sequences (
    tenant_id UUID NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, year)
);

-- Encounters Table
CREATE TABLE encounters (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    encounter_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    encounter_type VARCHAR(20) NOT NULL, -- OPD, IPD, Emergency
    encounter_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open', -- Open, Closed
    chief_complaint TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Clinical Notes Table
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    encounter_id UUID NOT NULL,
    note_type VARCHAR(20) NOT NULL DEFAULT 'SOAP', -- SOAP, Progress, Discharge
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Diagnoses Table
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    encounter_id UUID NOT NULL,
    icd10_code VARCHAR(10) NOT NULL,
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(20) NOT NULL DEFAULT 'Secondary', -- Primary, Secondary
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Vitals Table
CREATE TABLE vitals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    encounter_id UUID NOT NULL,
    temperature DECIMAL(4,1),
    pulse_rate INT,
    respiratory_rate INT,
    blood_pressure VARCHAR(20),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(5,2),
    oxygen_saturation INT,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Allergies Table
CREATE TABLE allergies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    allergy_type VARCHAR(50) NOT NULL, -- Drug, Food, Environmental
    allergen_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Mild', -- Mild, Moderate, Severe
    reaction TEXT,
    onset_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Procedures Table
CREATE TABLE procedures (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    encounter_id UUID NOT NULL,
    procedure_code VARCHAR(20) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    procedure_date TIMESTAMP NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Planned', -- Planned, Completed, Cancelled
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes for Performance (50,000+ encounters/day)

-- Encounters Indexes
CREATE INDEX idx_encounters_tenant_patient ON encounters(tenant_id, patient_id) WHERE is_deleted = false;
CREATE INDEX idx_encounters_tenant_doctor ON encounters(tenant_id, doctor_id) WHERE is_deleted = false;
CREATE INDEX idx_encounters_tenant_date ON encounters(tenant_id, encounter_date DESC) WHERE is_deleted = false;
CREATE INDEX idx_encounters_number ON encounters(encounter_number) WHERE is_deleted = false;
CREATE INDEX idx_encounters_status ON encounters(tenant_id, status) WHERE is_deleted = false;

-- Clinical Notes Indexes
CREATE INDEX idx_clinical_notes_encounter ON clinical_notes(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_clinical_notes_created ON clinical_notes(encounter_id, created_at DESC) WHERE is_deleted = false;

-- Diagnoses Indexes
CREATE INDEX idx_diagnoses_encounter ON diagnoses(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_diagnoses_icd10 ON diagnoses(tenant_id, icd10_code) WHERE is_deleted = false;
CREATE INDEX idx_diagnoses_type ON diagnoses(encounter_id, diagnosis_type) WHERE is_deleted = false;

-- Vitals Indexes
CREATE INDEX idx_vitals_encounter ON vitals(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_vitals_recorded ON vitals(encounter_id, recorded_at DESC) WHERE is_deleted = false;

-- Allergies Indexes
CREATE INDEX idx_allergies_patient ON allergies(tenant_id, patient_id) WHERE is_deleted = false;
CREATE INDEX idx_allergies_severity ON allergies(patient_id, severity DESC) WHERE is_deleted = false;

-- Procedures Indexes
CREATE INDEX idx_procedures_encounter ON procedures(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_procedures_date ON procedures(encounter_id, procedure_date DESC) WHERE is_deleted = false;

-- Comments
COMMENT ON TABLE encounters IS 'Patient encounters (visits) with doctors';
COMMENT ON TABLE clinical_notes IS 'SOAP and other clinical notes for encounters';
COMMENT ON TABLE diagnoses IS 'ICD-10 coded diagnoses for encounters';
COMMENT ON TABLE vitals IS 'Vital signs with auto-calculated BMI';
COMMENT ON TABLE allergies IS 'Patient allergy records';
COMMENT ON TABLE procedures IS 'Medical procedures performed or planned';
COMMENT ON TABLE emr_sequences IS 'Atomic sequence generation for encounter numbers';

-- Sample Data (Optional)
-- INSERT INTO emr_sequences (tenant_id, year, last_sequence) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 2024, 0);
