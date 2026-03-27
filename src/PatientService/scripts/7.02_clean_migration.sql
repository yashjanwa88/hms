-- PatientService Database Reset & Clean Migration v7.02
-- This script DROPS old incomplete tables and recreates them properly

-- =====================================================
-- CLEANUP: Drop old incomplete tables if they exist
-- =====================================================

DROP TABLE IF EXISTS patient_documents CASCADE;
DROP TABLE IF EXISTS patient_immunizations CASCADE;
DROP TABLE IF EXISTS patient_medication_history CASCADE;
DROP TABLE IF EXISTS patient_chronic_conditions CASCADE;
DROP TABLE IF EXISTS patient_allergies CASCADE;

DROP VIEW IF EXISTS vw_patient_clinical_summary CASCADE;
DROP FUNCTION IF EXISTS get_critical_allergies(UUID, UUID) CASCADE;

-- =====================================================
-- PATIENT ALLERGIES TABLE
-- =====================================================
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    allergen_type VARCHAR(50) NOT NULL,
    allergen_name VARCHAR(200) NOT NULL,
    reaction VARCHAR(500),
    severity VARCHAR(20) NOT NULL,
    onset_date DATE,
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_patient_allergies_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_patient_allergies_patient ON patient_allergies(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patient_allergies_severity ON patient_allergies(severity) WHERE is_deleted = false;
CREATE INDEX idx_patient_allergies_type ON patient_allergies(allergen_type) WHERE is_deleted = false;

-- =====================================================
-- CHRONIC CONDITIONS TABLE
-- =====================================================
CREATE TABLE patient_chronic_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    condition_name VARCHAR(200) NOT NULL,
    icd10_code VARCHAR(20),
    diagnosed_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_patient_conditions_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_patient_conditions_patient ON patient_chronic_conditions(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patient_conditions_status ON patient_chronic_conditions(status) WHERE is_deleted = false;
CREATE INDEX idx_patient_conditions_icd10 ON patient_chronic_conditions(icd10_code) WHERE is_deleted = false;

-- =====================================================
-- MEDICATION HISTORY TABLE
-- =====================================================
CREATE TABLE patient_medication_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    route VARCHAR(50),
    
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    
    prescribed_by VARCHAR(200),
    indication VARCHAR(500),
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_patient_medications_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_patient_medications_patient ON patient_medication_history(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patient_medications_current ON patient_medication_history(is_current) WHERE is_deleted = false;
CREATE INDEX idx_patient_medications_dates ON patient_medication_history(start_date, end_date);

-- =====================================================
-- IMMUNIZATION RECORDS TABLE
-- =====================================================
CREATE TABLE patient_immunizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_code VARCHAR(50),
    dose_number INT,
    administration_date DATE NOT NULL,
    
    administered_by VARCHAR(200),
    site VARCHAR(100),
    route VARCHAR(50),
    lot_number VARCHAR(100),
    manufacturer VARCHAR(200),
    expiry_date DATE,
    
    next_dose_due_date DATE,
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_patient_immunizations_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_patient_immunizations_patient ON patient_immunizations(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patient_immunizations_date ON patient_immunizations(administration_date);
CREATE INDEX idx_patient_immunizations_due ON patient_immunizations(next_dose_due_date) WHERE next_dose_due_date IS NOT NULL;

-- =====================================================
-- PATIENT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INT,
    mime_type VARCHAR(100),
    
    uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    is_confidential BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_patient_documents_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type) WHERE is_deleted = false;
CREATE INDEX idx_patient_documents_date ON patient_documents(uploaded_date);

-- =====================================================
-- UPDATE PATIENTS TABLE - ADD RH FACTOR
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'rh_factor'
    ) THEN
        ALTER TABLE patients ADD COLUMN rh_factor VARCHAR(10);
    END IF;
END $$;

-- =====================================================
-- VIEWS
-- =====================================================
CREATE OR REPLACE VIEW vw_patient_clinical_summary AS
SELECT 
    p.id as patient_id,
    p.tenant_id,
    p.uhid,
    p.first_name || ' ' || p.last_name as patient_name,
    p.blood_group,
    p.rh_factor,
    
    (SELECT COUNT(*) FROM patient_allergies 
     WHERE patient_id = p.id AND is_deleted = false) as allergy_count,
    
    (SELECT COUNT(*) FROM patient_chronic_conditions 
     WHERE patient_id = p.id AND is_deleted = false AND status = 'Active') as active_conditions_count,
    
    (SELECT COUNT(*) FROM patient_medication_history 
     WHERE patient_id = p.id AND is_deleted = false AND is_current = true) as current_medications_count,
    
    (SELECT COUNT(*) FROM patient_immunizations 
     WHERE patient_id = p.id AND is_deleted = false) as immunization_count,
    
    (SELECT COUNT(*) FROM patient_documents 
     WHERE patient_id = p.id AND is_deleted = false) as document_count

FROM patients p
WHERE p.is_deleted = false;

-- =====================================================
-- FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION get_critical_allergies(p_patient_id UUID, p_tenant_id UUID)
RETURNS TABLE (
    allergen_name VARCHAR(200),
    severity VARCHAR(20),
    reaction VARCHAR(500)
) AS $$
BEGIN
    RETURN QUERY
    SELECT pa.allergen_name, pa.severity, pa.reaction
    FROM patient_allergies pa
    WHERE pa.patient_id = p_patient_id 
      AND pa.tenant_id = p_tenant_id
      AND pa.is_deleted = false
      AND pa.severity IN ('Severe', 'Life-threatening')
    ORDER BY 
      CASE pa.severity 
        WHEN 'Life-threatening' THEN 1
        WHEN 'Severe' THEN 2
      END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERSION INFO
-- =====================================================
DELETE FROM schema_version WHERE version IN ('7.00', '7.01');

INSERT INTO schema_version (version, description) 
VALUES ('7.02', 'Clinical data - CLEAN MIGRATION with DROP and RECREATE')
ON CONFLICT (version) DO NOTHING;
