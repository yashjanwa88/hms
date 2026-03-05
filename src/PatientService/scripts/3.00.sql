-- =====================================================
-- PATIENT SERVICE PERFORMANCE OPTIMIZATION v3.00
-- Advanced indexing, partitioning, and query optimization
-- =====================================================

-- =====================================================
-- 1. PERFORMANCE INDEXES
-- =====================================================

-- Covering indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_patients_covering_basic 
    ON patients(tenant_id, uhid) 
    INCLUDE (first_name, last_name, mobile_number, status, created_at)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_patients_covering_search 
    ON patients(tenant_id, mobile_number) 
    INCLUDE (id, uhid, first_name, last_name, date_of_birth, status)
    WHERE is_deleted = false;

-- Partial indexes for active patients
CREATE INDEX IF NOT EXISTS idx_patients_active_only 
    ON patients(tenant_id, created_at DESC) 
    WHERE is_deleted = false AND status = 'Active';

-- Hash index for exact UHID lookups
CREATE INDEX IF NOT EXISTS idx_patients_uhid_hash 
    ON patients USING HASH(uhid) 
    WHERE is_deleted = false;

-- Composite index for duplicate detection (optimized)
CREATE INDEX IF NOT EXISTS idx_patients_duplicate_fast 
    ON patients(tenant_id, mobile_number, date_of_birth) 
    INCLUDE (id, first_name, last_name, uhid)
    WHERE is_deleted = false;

-- =====================================================
-- 2. SEARCH OPTIMIZATION INDEXES
-- =====================================================

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_patients_fulltext_gin 
    ON patients USING GIN(
        to_tsvector('english', 
            COALESCE(first_name, '') || ' ' || 
            COALESCE(last_name, '') || ' ' || 
            COALESCE(uhid, '') || ' ' || 
            COALESCE(mobile_number, '')
        )
    ) WHERE is_deleted = false;

-- Trigram index for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_patients_name_trigram 
    ON patients USING GIN(
        (first_name || ' ' || COALESCE(last_name, '')) gin_trgm_ops
    ) WHERE is_deleted = false;

-- =====================================================
-- 3. MATERIALIZED VIEW FOR ANALYTICS
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS patient_stats_mv AS
SELECT 
    tenant_id,
    COUNT(*) FILTER (WHERE is_deleted = false) as total_patients,
    COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as active_patients,
    COUNT(*) FILTER (WHERE DATE(registration_date) = CURRENT_DATE AND is_deleted = false) as today_registrations,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE) AND is_deleted = false) as month_registrations,
    MAX(created_at) as last_updated
FROM patients
GROUP BY tenant_id;

CREATE UNIQUE INDEX ON patient_stats_mv(tenant_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_patient_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Optimized patient search function
CREATE OR REPLACE FUNCTION search_patients_optimized(
    p_tenant_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_uhid TEXT DEFAULT NULL,
    p_mobile TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id UUID, uhid TEXT, first_name TEXT, last_name TEXT, 
    mobile_number TEXT, status TEXT, registration_date TIMESTAMP
) AS $$
BEGIN
    -- Use appropriate index based on search criteria
    IF p_uhid IS NOT NULL THEN
        RETURN QUERY
        SELECT p.id, p.uhid, p.first_name, p.last_name, p.mobile_number, p.status, p.registration_date
        FROM patients p
        WHERE p.tenant_id = p_tenant_id AND p.uhid = p_uhid AND p.is_deleted = false;
    
    ELSIF p_mobile IS NOT NULL THEN
        RETURN QUERY
        SELECT p.id, p.uhid, p.first_name, p.last_name, p.mobile_number, p.status, p.registration_date
        FROM patients p
        WHERE p.tenant_id = p_tenant_id AND p.mobile_number = p_mobile AND p.is_deleted = false;
    
    ELSIF p_search_term IS NOT NULL THEN
        RETURN QUERY
        SELECT p.id, p.uhid, p.first_name, p.last_name, p.mobile_number, p.status, p.registration_date
        FROM patients p
        WHERE p.tenant_id = p_tenant_id 
            AND p.is_deleted = false
            AND (
                p.first_name ILIKE '%' || p_search_term || '%' OR
                p.last_name ILIKE '%' || p_search_term || '%' OR
                p.uhid ILIKE '%' || p_search_term || '%' OR
                p.mobile_number ILIKE '%' || p_search_term || '%'
            )
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    
    ELSE
        RETURN QUERY
        SELECT p.id, p.uhid, p.first_name, p.last_name, p.mobile_number, p.status, p.registration_date
        FROM patients p
        WHERE p.tenant_id = p_tenant_id 
            AND p.is_deleted = false
            AND (p_status IS NULL OR p.status = p_status)
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. STATISTICS AND MONITORING
-- =====================================================

-- Query performance monitoring
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50),
    execution_time_ms INT,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON query_performance_log(query_type, created_at);

-- =====================================================
-- 6. VERSION UPDATE
-- =====================================================

INSERT INTO schema_version (version, description) 
VALUES ('3.00', 'Patient Service - Performance optimization with advanced indexing')
ON CONFLICT (version) DO NOTHING;