-- =====================================================
-- PATIENT REGISTRATION MODULE - OPTIMIZED INDEXES v2.00
-- High-performance indexes for patient registration, search, and duplicate detection
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PATIENT SEARCH INDEX TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL UNIQUE,
    uhid VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    alternate_mobile VARCHAR(20),
    email VARCHAR(255),
    full_name VARCHAR(300) NOT NULL,
    date_of_birth DATE NOT NULL,
    age INT NOT NULL,
    blood_group VARCHAR(10),
    city VARCHAR(100),
    pincode VARCHAR(10),
    search_text TEXT NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_search_patient FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CORE PATIENT TABLE INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_patients_uhid 
    ON patients(uhid) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patients_mobile 
    ON patients(mobile_number) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patients_email 
    ON patients(email) WHERE is_deleted = false AND email IS NOT NULL;

-- Composite indexes for duplicate detection
CREATE INDEX IF NOT EXISTS idx_patients_duplicate_check 
    ON patients(tenant_id, mobile_number, first_name, last_name, date_of_birth) 
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patients_name_dob 
    ON patients(tenant_id, first_name, last_name, date_of_birth) 
    WHERE is_deleted = false;

-- Tenant-based queries
CREATE INDEX IF NOT EXISTS idx_patients_tenant_status 
    ON patients(tenant_id, status) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patients_tenant_created 
    ON patients(tenant_id, created_at DESC) WHERE is_deleted = false;

-- Registration date queries
CREATE INDEX IF NOT EXISTS idx_patients_registration_date 
    ON patients(tenant_id, registration_date DESC) WHERE is_deleted = false;

-- Alternate mobile lookup
CREATE INDEX IF NOT EXISTS idx_patients_alternate_mobile 
    ON patients(alternate_mobile) 
    WHERE is_deleted = false AND alternate_mobile IS NOT NULL;

-- =====================================================
-- 3. PATIENT SEARCH INDEX TABLE INDEXES
-- =====================================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_search_tenant_id 
    ON patient_search_index(tenant_id) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_search_uhid 
    ON patient_search_index(uhid) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_search_mobile 
    ON patient_search_index(mobile_number) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_search_email 
    ON patient_search_index(email) 
    WHERE is_deleted = false AND email IS NOT NULL;

-- Name search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_search_full_name_lower 
    ON patient_search_index(tenant_id, full_name) 
    WHERE is_deleted = false;

-- Date of birth queries
CREATE INDEX IF NOT EXISTS idx_search_dob 
    ON patient_search_index(tenant_id, date_of_birth) 
    WHERE is_deleted = false;

-- Full-text search index (PostgreSQL GIN)
CREATE INDEX IF NOT EXISTS idx_search_text_gin 
    ON patient_search_index USING GIN(to_tsvector('english', search_text))
    WHERE is_deleted = false;

-- Composite search index
CREATE INDEX IF NOT EXISTS idx_search_composite 
    ON patient_search_index(tenant_id, uhid, mobile_number, full_name) 
    WHERE is_deleted = false;

-- =====================================================
-- 4. PATIENT SEQUENCES TABLE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patient_seq_tenant_year 
    ON patient_sequences(tenant_id, year) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patient_seq_tenant_code 
    ON patient_sequences(tenant_code, year) WHERE is_deleted = false;

-- =====================================================
-- 5. PERFORMANCE OPTIMIZATION - PARTIAL INDEXES
-- =====================================================

-- Active patients only
CREATE INDEX IF NOT EXISTS idx_patients_active 
    ON patients(tenant_id, id) 
    WHERE is_deleted = false AND status = 'Active';

-- Recent registrations (last 30 days) - Remove function from WHERE clause
CREATE INDEX IF NOT EXISTS idx_patients_recent 
    ON patients(tenant_id, registration_date DESC) 
    WHERE is_deleted = false;

-- Patients with insurance
CREATE INDEX IF NOT EXISTS idx_patients_insured 
    ON patients(tenant_id, insurance_provider_id) 
    WHERE is_deleted = false AND insurance_provider_id IS NOT NULL;

-- =====================================================
-- 6. COVERING INDEXES (Include columns for index-only scans)
-- =====================================================

-- Quick patient info lookup
CREATE INDEX IF NOT EXISTS idx_patients_quick_info 
    ON patients(tenant_id, uhid) 
    INCLUDE (first_name, last_name, mobile_number, date_of_birth, status)
    WHERE is_deleted = false;

-- =====================================================
-- 7. TRIGGER - Auto-update search index
-- =====================================================

CREATE OR REPLACE FUNCTION update_patient_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO patient_search_index (
        tenant_id, patient_id, uhid, mobile_number, alternate_mobile,
        email, full_name, date_of_birth, age, blood_group, city, pincode,
        search_text, last_updated
    ) VALUES (
        NEW.tenant_id, 
        NEW.id, 
        NEW.uhid, 
        NEW.mobile_number, 
        NEW.alternate_mobile,
        NEW.email, 
        CONCAT_WS(' ', NEW.first_name, NEW.middle_name, NEW.last_name),
        NEW.date_of_birth,
        EXTRACT(YEAR FROM AGE(NEW.date_of_birth)),
        NEW.blood_group, 
        NEW.city, 
        NEW.pincode,
        LOWER(CONCAT_WS(' ', NEW.uhid, NEW.first_name, NEW.middle_name, NEW.last_name, 
                  NEW.mobile_number, NEW.email, NEW.city, NEW.pincode)),
        NOW()
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
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_patient_search_index ON patients;

CREATE TRIGGER trg_patient_search_index
AFTER INSERT OR UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_patient_search_index();

-- =====================================================
-- 8. STATISTICS UPDATE
-- =====================================================

-- Analyze tables for query planner
ANALYZE patients;
ANALYZE patient_search_index;
ANALYZE patient_sequences;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE patient_search_index IS 'Optimized search index for patient quick lookup';
COMMENT ON INDEX idx_patients_duplicate_check IS 'Composite index for duplicate detection';
COMMENT ON INDEX idx_search_text_gin IS 'Full-text search index using PostgreSQL GIN';
COMMENT ON FUNCTION update_patient_search_index() IS 'Auto-updates search index on patient insert/update';

-- =====================================================
-- 10. VERSION INFO
-- =====================================================

INSERT INTO schema_version (version, description) 
VALUES ('2.00', 'Patient Registration Module - Optimized indexes and search')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
