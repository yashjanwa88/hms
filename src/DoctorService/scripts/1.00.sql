-- Doctor Service Database Schema v1.00
-- Database: doctor_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    license_number VARCHAR(100) NOT NULL,
    license_expiry_date DATE,
    experience_years INTEGER NOT NULL DEFAULT 0,
    department VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    emergency_contact_name VARCHAR(200),
    emergency_contact_number VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_doctors_tenant_code UNIQUE (tenant_id, doctor_code),
    CONSTRAINT uk_doctors_tenant_mobile UNIQUE (tenant_id, mobile_number)
);

CREATE INDEX idx_doctors_tenant_id ON doctors(tenant_id);
CREATE INDEX idx_doctors_doctor_code ON doctors(doctor_code);
CREATE INDEX idx_doctors_department ON doctors(department);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);
CREATE INDEX idx_doctors_is_deleted ON doctors(is_deleted);
CREATE INDEX idx_doctors_created_at ON doctors(created_at DESC);

-- =====================================================
-- DOCTOR SPECIALIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    specialization_name VARCHAR(200) NOT NULL,
    certification_body VARCHAR(200),
    certification_date DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_doctor_specializations_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE INDEX idx_doctor_specializations_doctor_id ON doctor_specializations(doctor_id);
CREATE INDEX idx_doctor_specializations_tenant_id ON doctor_specializations(tenant_id);
CREATE INDEX idx_doctor_specializations_name ON doctor_specializations(specialization_name);
CREATE INDEX idx_doctor_specializations_is_deleted ON doctor_specializations(is_deleted);

-- =====================================================
-- DOCTOR QUALIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    degree_name VARCHAR(200) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    university VARCHAR(200),
    year_of_completion INTEGER NOT NULL,
    country VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_doctor_qualifications_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE INDEX idx_doctor_qualifications_doctor_id ON doctor_qualifications(doctor_id);
CREATE INDEX idx_doctor_qualifications_tenant_id ON doctor_qualifications(tenant_id);
CREATE INDEX idx_doctor_qualifications_is_deleted ON doctor_qualifications(is_deleted);

-- =====================================================
-- DOCTOR AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 15,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_doctor_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT chk_availability_times CHECK (end_time > start_time)
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_tenant_id ON doctor_availability(tenant_id);
CREATE INDEX idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX idx_doctor_availability_is_available ON doctor_availability(is_available);
CREATE INDEX idx_doctor_availability_is_deleted ON doctor_availability(is_deleted);

-- =====================================================
-- DOCTOR LEAVE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_leave (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_doctor_leave_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_doctor_leave_doctor_id ON doctor_leave(doctor_id);
CREATE INDEX idx_doctor_leave_tenant_id ON doctor_leave(tenant_id);
CREATE INDEX idx_doctor_leave_dates ON doctor_leave(start_date, end_date);
CREATE INDEX idx_doctor_leave_status ON doctor_leave(status);
CREATE INDEX idx_doctor_leave_is_deleted ON doctor_leave(is_deleted);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE doctors IS 'Doctor master data';
COMMENT ON TABLE doctor_specializations IS 'Doctor specializations and certifications';
COMMENT ON TABLE doctor_qualifications IS 'Doctor educational qualifications';
COMMENT ON TABLE doctor_availability IS 'Doctor weekly availability schedule';
COMMENT ON TABLE doctor_leave IS 'Doctor leave records';

COMMENT ON COLUMN doctors.doctor_code IS 'Unique doctor code - Format: DOC-TENANTCODE-000001';
COMMENT ON COLUMN doctor_availability.slot_duration_minutes IS 'Duration of each appointment slot in minutes';

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES ('1.00', 'Initial Doctor Service schema')
ON CONFLICT DO NOTHING;
