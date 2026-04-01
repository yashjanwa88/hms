-- =====================================================
-- FIX PATIENT SEARCH FUNCTION v7.03
-- Return all necessary columns for Patient model
-- =====================================================

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
            p.first_name ILIKE '%' || p_search_term || '%' OR
            p.last_name ILIKE '%' || p_search_term || '%' OR
            p.uhid ILIKE '%' || p_search_term || '%' OR
            p.mobile_number ILIKE '%' || p_search_term || '%'
        )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

INSERT INTO schema_version (version, description) 
VALUES ('7.03', 'Fix search_patients_optimized to return all columns')
ON CONFLICT (version) DO NOTHING;
