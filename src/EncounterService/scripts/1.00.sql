-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Encounters table
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    encounter_number VARCHAR(50) NOT NULL UNIQUE,
    visit_type VARCHAR(20) NOT NULL CHECK (visit_type IN ('OPD', 'IPD', 'Emergency')),
    department VARCHAR(100),
    chief_complaint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    encounter_date TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Encounter sequences table (for number generation)
CREATE TABLE IF NOT EXISTS encounter_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_encounters_tenant ON encounters(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_doctor ON encounters(doctor_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(encounter_date DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_number ON encounters(encounter_number) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_encounters_composite ON encounters(tenant_id, patient_id, encounter_date DESC) WHERE is_deleted = false;
