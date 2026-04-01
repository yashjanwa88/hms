-- =====================================================
-- ADVANCED SEARCH & PATIENT HISTORY TIMELINE v7.04
-- =====================================================

-- 1. Create a table for Unified Patient History Timeline
-- This tracks events from Clinical, Appointment, and Billing modules
CREATE TABLE IF NOT EXISTS patient_event_timeline (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'visit', 'diagnosis', 'medication', 'lab', 'billing', 'registration'
    event_title VARCHAR(200) NOT NULL,
    event_description TEXT,
    event_date TIMESTAMP NOT NULL DEFAULT NOW(),
    source_module VARCHAR(50) NOT NULL, -- 'clinical', 'appointment', 'billing', 'patient'
    source_id UUID, -- ID of the actual record in the source module (e.g., invoice_id, appointment_id)
    doctor_id UUID,
    doctor_name VARCHAR(200),
    status VARCHAR(50),
    metadata JSONB, -- Store additional module-specific data
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_timeline_patient_date ON patient_event_timeline(patient_id, event_date DESC) WHERE is_deleted = false;
CREATE INDEX idx_timeline_type ON patient_event_timeline(event_type) WHERE is_deleted = false;

-- 2. Add Full-Text Search (FTS) Support to Patients Table
-- This makes search "smart and fast" by indexing searchable fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update function to populate search_vector
CREATE OR REPLACE FUNCTION patients_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.last_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.uhid, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.mobile_number, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.email, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger for search_vector
DROP TRIGGER IF EXISTS trg_patients_search_vector_update ON patients;
CREATE TRIGGER trg_patients_search_vector_update
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION patients_search_vector_update();

-- Initial update for existing records
UPDATE patients SET search_vector = 
    setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(last_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(uhid, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(mobile_number, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'C')
WHERE search_vector IS NULL;

-- Create GIN index for search_vector
CREATE INDEX IF NOT EXISTS idx_patients_fts ON patients USING GIN(search_vector);

-- 3. Update Search Function to use Full-Text Search (Smart & Fast)
CREATE OR REPLACE FUNCTION search_patients_optimized(
    p_tenant_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_uhid TEXT DEFAULT NULL,
    p_mobile TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id UUID, tenant_id UUID, uhid VARCHAR(50), first_name VARCHAR(100), middle_name VARCHAR(100), last_name VARCHAR(100),
    gender VARCHAR(20), date_of_birth DATE, blood_group VARCHAR(10), rh_factor VARCHAR(10), marital_status VARCHAR(20),
    mobile_number VARCHAR(20), alternate_mobile VARCHAR(20), email VARCHAR(255), whats_app_number VARCHAR(20),
    address_line1 VARCHAR(500), address_line2 VARCHAR(500), city VARCHAR(100), state VARCHAR(100), pincode VARCHAR(20), country VARCHAR(100),
    allergies_summary TEXT, chronic_conditions TEXT, current_medications TEXT, disability_status VARCHAR(100), organ_donor BOOLEAN,
    emergency_contact_name VARCHAR(200), emergency_contact_relation VARCHAR(100), emergency_contact_mobile VARCHAR(20),
    insurance_provider_id UUID, policy_number VARCHAR(100), valid_from DATE, valid_to DATE,
    consent_terms_accepted BOOLEAN, consent_privacy_accepted BOOLEAN, consent_health_data_sharing BOOLEAN, consent_recorded_at TIMESTAMP,
    registration_date TIMESTAMP, registered_by UUID, status VARCHAR(20), visit_count INT,
    created_at TIMESTAMP, created_by UUID, updated_at TIMESTAMP, updated_by UUID, is_deleted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM patients p
    WHERE p.tenant_id = p_tenant_id 
        AND p.is_deleted = false
        AND (p_uhid IS NULL OR p_uhid = '' OR p.uhid = p_uhid)
        AND (p_mobile IS NULL OR p_mobile = '' OR p.mobile_number = p_mobile)
        AND (p_status IS NULL OR p_status = '' OR p.status = p_status)
        AND (p_gender IS NULL OR p_gender = '' OR p.gender = p_gender)
        AND (p_city IS NULL OR p_city = '' OR p.city ILIKE '%' || p_city || '%')
        AND (
            p_search_term IS NULL OR p_search_term = '' OR
            p.search_vector @@ websearch_to_tsquery('english', p_search_term) OR -- Smart Search (Ranked)
            p.uhid ILIKE '%' || p_search_term || '%' OR -- Fallback for partial UHID
            p.mobile_number ILIKE '%' || p_search_term || '%' -- Fallback for partial Mobile
        )
    ORDER BY 
        CASE WHEN p_search_term IS NOT NULL AND p_search_term <> '' 
             THEN ts_rank_cd(p.search_vector, websearch_to_tsquery('english', p_search_term)) 
             ELSE 0 
        END DESC,
        p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Automatic Timeline Triggers
-- Record registration in timeline when a new patient is added
CREATE OR REPLACE FUNCTION trg_patient_registration_timeline() RETURNS trigger AS $$
BEGIN
    INSERT INTO patient_event_timeline (
        id, tenant_id, patient_id, event_type, event_title, 
        event_description, event_date, source_module, source_id, 
        status, created_at, is_deleted
    ) VALUES (
        gen_random_uuid(), NEW.tenant_id, NEW.id, 'registration', 'Patient Registered', 
        'New patient record created at reception.', NEW.registration_date, 'patient', NEW.id, 
        'Active', NOW(), false
    );
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patient_registration_timeline ON patients;
CREATE TRIGGER trg_patient_registration_timeline
    AFTER INSERT ON patients
    FOR EACH ROW EXECUTE FUNCTION trg_patient_registration_timeline();

-- 5. Receptionist Specific View: Today's Registrations & Status
CREATE OR REPLACE VIEW view_receptionist_daily_stats AS
SELECT 
    tenant_id,
    COUNT(*) FILTER (WHERE registration_date::date = CURRENT_DATE) as today_registrations,
    COUNT(*) FILTER (WHERE status = 'Active') as active_patients,
    COUNT(*) FILTER (WHERE is_deleted = false) as total_live_patients
FROM patients
GROUP BY tenant_id;

-- 4. Record the migration
INSERT INTO schema_version (version, description) 
VALUES ('7.04', 'Add Patient Event Timeline and Full-Text Search Support')
ON CONFLICT (version) DO NOTHING;
