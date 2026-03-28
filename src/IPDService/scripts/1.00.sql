-- Initial IPD Database Schema

CREATE TABLE wards (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    base_price_per_day DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_wards_tenant ON wards(tenant_id);

CREATE TABLE beds (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ward_id UUID NOT NULL,
    bed_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_bed_ward FOREIGN KEY (ward_id) REFERENCES wards(id)
);

CREATE INDEX idx_beds_tenant ON beds(tenant_id);
CREATE INDEX idx_beds_ward ON beds(ward_id);

CREATE TABLE admissions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    primary_doctor_id UUID NOT NULL,
    ward_id UUID NOT NULL,
    bed_id UUID NOT NULL,
    admission_number VARCHAR(50) NOT NULL,
    admission_date TIMESTAMP NOT NULL,
    discharge_date TIMESTAMP,
    reason_for_admission TEXT,
    status VARCHAR(50) NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_admission_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
    CONSTRAINT fk_admission_bed FOREIGN KEY (bed_id) REFERENCES beds(id)
);

CREATE INDEX idx_admissions_tenant ON admissions(tenant_id);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_status ON admissions(status);
