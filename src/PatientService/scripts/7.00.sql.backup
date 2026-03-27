-- Patient Service Clinical Data Enhancement v7.00
-- Database: patient_db
-- Adds structured clinical data tables for better management

-- =====================================================
-- PATIENT ALLERGIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    allergen_type VARCHAR(50) NOT NULL,  -- Drug, Food, Environmental, Other
    allergen_name VARCHAR(200) NOT NULL,
    reaction VARCHAR(500),  -- Symptoms/reaction description
    severity VARCHAR(20) NOT NULL,  -- Mild, Moderate, Severe, Life-threatening
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

COMMENT ON TABLE patient_allergies IS 'Patient allergy information for safety alerts';
COMMENT ON COLUMN patient_allergies.severity IS 'Mild, Moderate, Severe, Life-threatening';

-- =====================================================
-- CHRONIC CONDITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_chronic_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    condition_name VARCHAR(200) NOT NULL,
    icd10_code VARCHAR(20),  -- ICD-10 diagnosis code
    diagnosed_date DATE,
    status VARCHAR(50) DEFAULT 'Active',  -- Active, Managed, Resolved, Recurrent
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

COMMENT ON TABLE patient_chronic_conditions IS 'Long-term medical conditions requiring ongoing management';

-- =====================================================
-- MEDICATION HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_medication_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    dosage VARCHAR(100),  -- e.g., "500mg", "5ml"
    frequency VARCHAR(100),  -- e.g., "Twice daily", "Every 8 hours"
    route VARCHAR(50),  -- Oral, IV, IM, Topical, etc.
    
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    
    prescribed_by VARCHAR(200),  -- Doctor name
    indication VARCHAR(500),  -- Reason for medication
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

COMMENT ON TABLE patient_medication_history IS 'Patient medication history (current and past)';

-- =====================================================
-- IMMUNIZATION RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_immunizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_code VARCHAR(50),  -- CVX code (CDC vaccine codes)
    dose_number INT,  -- 1st dose, 2nd dose, booster, etc.
    administration_date DATE NOT NULL,
    
    administered_by VARCHAR(200),
    site VARCHAR(100),  -- Left arm, Right arm, Thigh, etc.
    route VARCHAR(50),  -- IM, SC, Oral, Intranasal
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

COMMENT ON TABLE patient_immunizations IS 'Patient immunization/vaccination records';

-- =====================================================
-- PATIENT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    document_type VARCHAR(100) NOT NULL,  -- ID_Proof, Medical_Record, Consent_Form, Lab_Report, etc.
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,  -- S3/Azure Blob/local file path
    file_size_kb INT,
    mime_type VARCHAR(100),  -- application/pdf, image/jpeg, etc.
    
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

COMMENT ON TABLE patient_documents IS 'Patient document attachments (PDFs, images, scans)';

-- =====================================================
-- UPDATE PATIENTS TABLE - ENSURE BLOOD GROUP EXISTS
-- =====================================================
-- Blood group already exists in patients table (line 63 of 1.00.sql)
-- Just add RH factor if not present

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'rh_factor'
    ) THEN
        ALTER TABLE patients ADD COLUMN rh_factor VARCHAR(10);
        COMMENT ON COLUMN patients.rh_factor IS 'Positive or Negative';
    END IF;
END $$;

-- =====================================================
-- SAMPLE DATA (for development/testing)
-- =====================================================

-- Common allergen types reference data could be added here
-- Common chronic conditions reference data could be added here

-- =====================================================
-- VIEWS FOR QUICK ACCESS
-- =====================================================

-- View: Patient complete clinical summary
CREATE OR REPLACE VIEW vw_patient_clinical_summary AS
SELECT 
    p.id as patient_id,
    p.tenant_id,
    p.uhid,
    p.first_name || ' ' || p.last_name as patient_name,
    p.blood_group,
    p.rh_factor,
    
    -- Allergy count
    (SELECT COUNT(*) FROM patient_allergies 
     WHERE patient_id = p.id AND is_deleted = false) as allergy_count,
    
    -- Chronic condition count
    (SELECT COUNT(*) FROM patient_chronic_conditions 
     WHERE patient_id = p.id AND is_deleted = false AND status = 'Active') as active_conditions_count,
    
    -- Current medications count
    (SELECT COUNT(*) FROM patient_medication_history 
     WHERE patient_id = p.id AND is_deleted = false AND is_current = true) as current_medications_count,
    
    -- Immunization count
    (SELECT COUNT(*) FROM patient_immunizations 
     WHERE patient_id = p.id AND is_deleted = false) as immunization_count,
    
    -- Document count
    (SELECT COUNT(*) FROM patient_documents 
     WHERE patient_id = p.id AND is_deleted = false) as document_count

FROM patients p
WHERE p.is_deleted = false;

COMMENT ON VIEW vw_patient_clinical_summary IS 'Quick overview of patient clinical data';

-- =====================================================
-- FUNCTIONS FOR CLINICAL ALERTS
-- =====================================================

-- Function to get critical allergies for a patient
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

COMMENT ON FUNCTION get_critical_allergies IS 'Returns severe and life-threatening allergies for safety alerts';

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_version (version, description) 
VALUES ('7.00', 'Clinical data enhancement - allergies, conditions, medications, immunizations, documents')
ON CONFLICT (version) DO NOTHING;
