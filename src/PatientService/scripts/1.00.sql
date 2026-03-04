-- Patient Service Database Schema v1.00
-- Database: patient_db
-- Optimized for 5M+ patients with fast search

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PATIENT SEQUENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_patient_sequences_tenant_year UNIQUE (tenant_id, year)
);

CREATE INDEX idx_patient_sequences_tenant_year ON patient_sequences(tenant_id, year);

-- =====================================================
-- INSURANCE PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_insurance_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_insurance_providers_tenant_code UNIQUE (tenant_id, provider_code)
);

CREATE INDEX idx_insurance_providers_tenant ON patient_insurance_providers(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_insurance_providers_active ON patient_insurance_providers(tenant_id, is_active) WHERE is_deleted = false;

-- =====================================================
-- PATIENTS TABLE (MAIN)
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identity
    uhid VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    blood_group VARCHAR(10),
    marital_status VARCHAR(20),
    
    -- Contact
    mobile_number VARCHAR(20) NOT NULL,
    alternate_mobile VARCHAR(20),
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100),
    
    -- Medical Basic
    allergies_summary TEXT,
    chronic_conditions TEXT,
    current_medications TEXT,
    disability_status VARCHAR(100),
    organ_donor BOOLEAN DEFAULT FALSE,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_mobile VARCHAR(20),
    
    -- Insurance Link
    insurance_provider_id UUID,
    policy_number VARCHAR(100),
    valid_from DATE,
    valid_to DATE,
    
    -- System
    registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
    registered_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    visit_count INT DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT uk_patients_tenant_uhid UNIQUE (tenant_id, uhid),
    CONSTRAINT fk_patients_insurance_provider FOREIGN KEY (insurance_provider_id) REFERENCES patient_insurance_providers(id)
);

-- Performance Indexes for 5M+ records
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_patients_tenant_mobile ON patients(tenant_id, mobile_number) WHERE is_deleted = false;
CREATE INDEX idx_patients_uhid ON patients(uhid) WHERE is_deleted = false;
CREATE INDEX idx_patients_tenant_policy ON patients(tenant_id, policy_number) WHERE is_deleted = false AND policy_number IS NOT NULL;
CREATE INDEX idx_patients_tenant_status ON patients(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX idx_patients_registration_date ON patients(registration_date DESC);
CREATE INDEX idx_patients_search_name ON patients(tenant_id, first_name, last_name) WHERE is_deleted = false;
CREATE INDEX idx_patients_search_mobile ON patients USING btree (tenant_id, mobile_number text_pattern_ops) WHERE is_deleted = false;

-- Full-text search index
CREATE INDEX idx_patients_fulltext ON patients USING gin(to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(middle_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(uhid, '') || ' ' || 
    coalesce(mobile_number, '')
)) WHERE is_deleted = false;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE patients IS 'Main patient registry - optimized for 5M+ records';
COMMENT ON TABLE patient_sequences IS 'UHID sequence generator per tenant per year';
COMMENT ON TABLE patient_insurance_providers IS 'Insurance provider master data';

COMMENT ON COLUMN patients.uhid IS 'Unique Hospital ID - Format: PAT-{TENANTCODE}-{YYYY}-{SEQUENCE}';
COMMENT ON COLUMN patients.status IS 'Active, Inactive, Deceased';
COMMENT ON COLUMN patients.visit_count IS 'Total number of visits/appointments';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate next UHID
CREATE OR REPLACE FUNCTION generate_uhid(p_tenant_id UUID, p_tenant_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_year INT;
    v_sequence INT;
    v_uhid VARCHAR;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    
    -- Get or create sequence
    INSERT INTO patient_sequences (tenant_id, tenant_code, year, last_sequence)
    VALUES (p_tenant_id, p_tenant_code, v_year, 1)
    ON CONFLICT (tenant_id, year) 
    DO UPDATE SET 
        last_sequence = patient_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO v_sequence;
    
    -- Format: PAT-HOSP-2024-000001
    v_uhid := 'PAT-' || p_tenant_code || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    RETURN v_uhid;
END;
$$ LANGUAGE plpgsql;

-- Function to check duplicate patients
CREATE OR REPLACE FUNCTION check_duplicate_patient(
    p_tenant_id UUID,
    p_mobile_number VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_date_of_birth DATE
)
RETURNS TABLE (
    patient_id UUID,
    uhid VARCHAR,
    full_name VARCHAR,
    mobile VARCHAR,
    match_score INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.uhid,
        p.first_name || ' ' || COALESCE(p.middle_name || ' ', '') || p.last_name,
        p.mobile_number,
        CASE 
            WHEN p.mobile_number = p_mobile_number AND p.date_of_birth = p_date_of_birth THEN 100
            WHEN p.mobile_number = p_mobile_number THEN 80
            WHEN LOWER(p.first_name) = LOWER(p_first_name) 
                AND LOWER(p.last_name) = LOWER(p_last_name) 
                AND p.date_of_birth = p_date_of_birth THEN 70
            ELSE 50
        END as match_score
    FROM patients p
    WHERE p.tenant_id = p_tenant_id
        AND p.is_deleted = false
        AND (
            p.mobile_number = p_mobile_number
            OR (
                LOWER(p.first_name) = LOWER(p_first_name)
                AND LOWER(p.last_name) = LOWER(p_last_name)
                AND p.date_of_birth = p_date_of_birth
            )
        )
    ORDER BY match_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('1.00', 'Initial Patient Service schema - Production ready for 5M+ patients')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment below to insert sample insurance providers
/*
INSERT INTO patient_insurance_providers (tenant_id, provider_name, provider_code, contact_number, email)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Star Health Insurance', 'STAR', '1800-425-2255', 'care@starhealth.in'),
    ('550e8400-e29b-41d4-a716-446655440000', 'ICICI Lombard', 'ICICI', '1800-266-7780', 'customersupport@icicilombard.com'),
    ('550e8400-e29b-41d4-a716-446655440000', 'HDFC ERGO', 'HDFC', '1800-266-0700', 'customerservice@hdfcergo.com')
ON CONFLICT DO NOTHING;
*/
