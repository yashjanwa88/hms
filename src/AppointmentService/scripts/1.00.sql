-- Appointment Service Database Schema v1.00
-- Database: appointment_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    appointment_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    appointment_type VARCHAR(50) NOT NULL,
    reason TEXT,
    notes TEXT,
    check_in_time TIMESTAMP,
    completed_time TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_appointments_tenant_number UNIQUE (tenant_id, appointment_number),
    CONSTRAINT uk_appointments_slot UNIQUE (tenant_id, doctor_id, appointment_date, start_time),
    CONSTRAINT chk_appointments_times CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_is_deleted ON appointments(is_deleted);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);

-- =====================================================
-- APPOINTMENT STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    appointment_id UUID NOT NULL,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    reason TEXT,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_appointment_status_history_appointment_id ON appointment_status_history(appointment_id);
CREATE INDEX idx_appointment_status_history_tenant_id ON appointment_status_history(tenant_id);
CREATE INDEX idx_appointment_status_history_changed_at ON appointment_status_history(changed_at DESC);

-- =====================================================
-- APPOINTMENT SLOT LOCK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_slot_lock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lock_token VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_appointment_slot_lock_doctor_date ON appointment_slot_lock(doctor_id, appointment_date);
CREATE INDEX idx_appointment_slot_lock_expires_at ON appointment_slot_lock(expires_at);
CREATE INDEX idx_appointment_slot_lock_tenant_id ON appointment_slot_lock(tenant_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE appointments IS 'Patient appointment records';
COMMENT ON TABLE appointment_status_history IS 'Audit trail for appointment status changes';
COMMENT ON TABLE appointment_slot_lock IS 'Temporary locks to prevent double booking during appointment creation';

COMMENT ON COLUMN appointments.appointment_number IS 'Unique appointment number - Format: APPT-TENANTCODE-YYYY-000001';
COMMENT ON COLUMN appointments.status IS 'Appointment status: Scheduled, Rescheduled, CheckedIn, Completed, Cancelled';
COMMENT ON COLUMN appointment_slot_lock.lock_token IS 'Unique token to identify the lock owner';
COMMENT ON COLUMN appointment_slot_lock.expires_at IS 'Lock expiration time (typically 5-10 minutes)';

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES ('1.00', 'Initial Appointment Service schema')
ON CONFLICT DO NOTHING;
