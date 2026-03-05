-- =====================================================
-- VISIT SERVICE DATABASE SCHEMA v1.00
-- OPD, Emergency, IPD Conversion, Timeline Management
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. VISITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    visit_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL,
    patient_uhid VARCHAR(50) NOT NULL,
    appointment_id UUID,
    doctor_id UUID NOT NULL,
    doctor_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    visit_type VARCHAR(20) NOT NULL CHECK (visit_type IN ('OPD', 'Emergency', 'IPD')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent', 'Emergency')),
    status VARCHAR(20) NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'InProgress', 'Completed', 'Cancelled')),
    visit_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    chief_complaint TEXT,
    symptoms TEXT,
    vital_signs TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    instructions TEXT,
    follow_up_date VARCHAR(50),
    is_emergency BOOLEAN DEFAULT FALSE,
    is_ipd_converted BOOLEAN DEFAULT FALSE,
    ipd_admission_id UUID,
    consultation_fee DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partial', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 2. VISIT TIMELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visit_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    event_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    performed_by UUID,
    performed_by_name VARCHAR(200),
    event_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_timeline_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. VISIT SEQUENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visit_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(10) NOT NULL,
    visit_type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_visit_seq UNIQUE (tenant_id, visit_type, date)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_visits_tenant_id ON visits(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_patient_uhid ON visits(patient_uhid) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id) WHERE is_deleted = false;

-- Status and type indexes
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_type ON visits(tenant_id, visit_type) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_emergency ON visits(tenant_id, is_emergency) WHERE is_deleted = false AND is_emergency = true;

-- Date-based indexes
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(tenant_id, DATE(visit_date_time)) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_visits_datetime ON visits(tenant_id, visit_date_time DESC) WHERE is_deleted = false;

-- Active visits (priority queue)
CREATE INDEX IF NOT EXISTS idx_visits_active ON visits(tenant_id, priority, visit_date_time) 
    WHERE is_deleted = false AND status IN ('Waiting', 'InProgress');

-- Patient history (optimized)
CREATE INDEX IF NOT EXISTS idx_visits_patient_history ON visits(patient_id, visit_date_time DESC) 
    WHERE is_deleted = false;

-- Department-wise queries
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits(tenant_id, department, visit_date_time DESC) 
    WHERE is_deleted = false;

-- Timeline indexes
CREATE INDEX IF NOT EXISTS idx_timeline_visit_id ON visit_timeline(visit_id, event_date_time ASC) 
    WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_timeline_tenant ON visit_timeline(tenant_id) WHERE is_deleted = false;

-- Sequence indexes
CREATE INDEX IF NOT EXISTS idx_visit_seq_tenant_type ON visit_sequences(tenant_id, visit_type, date);

-- =====================================================
-- 5. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Search optimization
CREATE INDEX IF NOT EXISTS idx_visits_search ON visits(tenant_id, visit_type, status, visit_date_time DESC) 
    WHERE is_deleted = false;

-- Doctor's daily visits
CREATE INDEX IF NOT EXISTS idx_visits_doctor_daily ON visits(doctor_id, DATE(visit_date_time), status) 
    WHERE is_deleted = false;

-- Emergency priority
CREATE INDEX IF NOT EXISTS idx_visits_emergency_priority ON visits(tenant_id, is_emergency, priority, visit_date_time) 
    WHERE is_deleted = false;

-- =====================================================
-- 6. SCHEMA VERSION TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_version (version, description) 
VALUES ('1.00', 'Visit Service - Initial schema with OPD, Emergency, Timeline')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON TABLE visits IS 'Main visits table for OPD, Emergency, and IPD conversions';
COMMENT ON TABLE visit_timeline IS 'Timeline tracking for visit events';
COMMENT ON TABLE visit_sequences IS 'Visit number sequence generation';
COMMENT ON INDEX idx_visits_active IS 'Optimized index for active visits queue';
COMMENT ON INDEX idx_visits_patient_history IS 'Optimized for patient visit history queries';

-- =====================================================
-- END OF SCRIPT
-- =====================================================