-- Patient Service Database Schema v4.00
-- New: Patient Masters, Queue, Renewal, Card Reprint, Audit Log, Import Jobs
-- NOTE: Run AFTER 1.00, 2.00, 3.00

-- =====================================================
-- PATIENT MASTERS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_prefixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    prefix_name VARCHAR(20) NOT NULL,
    gender_applicable VARCHAR(20),           -- Male, Female, Both
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_patient_prefixes UNIQUE (tenant_id, prefix_name)
);

CREATE TABLE IF NOT EXISTS patient_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_patient_types UNIQUE (tenant_id, type_code)
);

CREATE TABLE IF NOT EXISTS registration_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) NOT NULL,
    description TEXT,
    validity_days INT NOT NULL DEFAULT 365,
    registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_registration_types UNIQUE (tenant_id, type_code)
);

-- Add new columns to patients (safe - IF NOT EXISTS)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS prefix VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_type_id UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_type_id UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS valid_till DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reprint_count INT NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_reprint_date TIMESTAMP;

-- FK constraints (add only if columns were just created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_patients_patient_type'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT fk_patients_patient_type
            FOREIGN KEY (patient_type_id) REFERENCES patient_types(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_patients_registration_type'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT fk_patients_registration_type
            FOREIGN KEY (registration_type_id) REFERENCES registration_types(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_valid_till      ON patients(tenant_id, valid_till) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_patients_walk_in         ON patients(tenant_id, is_walk_in) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_patients_patient_type    ON patients(tenant_id, patient_type_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_patients_reg_type        ON patients(tenant_id, registration_type_id) WHERE is_deleted = false;

-- =====================================================
-- PATIENT QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    token_number VARCHAR(20) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    department_id UUID,
    department_name VARCHAR(100),
    doctor_id UUID,
    doctor_name VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'Waiting',   -- Waiting, InProgress, Completed, Cancelled, NoShow
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',  -- Normal, Emergency, VIP
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    registration_time TIMESTAMP NOT NULL DEFAULT NOW(),
    called_time TIMESTAMP,
    completed_time TIMESTAMP,
    cancelled_time TIMESTAMP,
    cancel_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_queue_tenant_date ON patient_queue(tenant_id, queue_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_queue_patient     ON patient_queue(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_queue_status      ON patient_queue(tenant_id, status, queue_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_queue_doctor      ON patient_queue(tenant_id, doctor_id, queue_date) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS queue_token_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    queue_date DATE NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_queue_token_seq UNIQUE (tenant_id, department_code, queue_date)
);

-- =====================================================
-- PATIENT RENEWAL
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    renewal_number VARCHAR(30) NOT NULL,
    previous_valid_till DATE NOT NULL,
    new_valid_till DATE NOT NULL,
    renewal_period_days INT NOT NULL,
    renewal_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'Cash',
    payment_reference VARCHAR(100),
    renewed_by UUID NOT NULL,
    renewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_renewals_patient ON patient_renewals(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_renewals_tenant  ON patient_renewals(tenant_id, renewed_at DESC) WHERE is_deleted = false;

-- =====================================================
-- CARD REPRINT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_card_reprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    reprint_number INT NOT NULL DEFAULT 1,
    reason VARCHAR(100) NOT NULL,
    charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'Cash',
    payment_reference VARCHAR(100),
    reprinted_by UUID NOT NULL,
    reprinted_by_name VARCHAR(200),
    reprinted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_card_reprints_patient ON patient_card_reprints(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_card_reprints_tenant  ON patient_card_reprints(tenant_id, reprinted_at DESC) WHERE is_deleted = false;

-- =====================================================
-- PATIENT AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    patient_uhid VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,             -- Created, Updated, Deleted, Merged, Renewed, Viewed, Reprinted
    entity_name VARCHAR(50) NOT NULL DEFAULT 'Patient',
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    changed_by UUID NOT NULL,
    changed_by_name VARCHAR(200),
    changed_by_role VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
    -- No is_deleted: audit logs are immutable
);

CREATE INDEX IF NOT EXISTS idx_audit_patient    ON patient_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant     ON patient_audit_logs(tenant_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON patient_audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_uhid       ON patient_audit_logs(patient_uhid);

-- =====================================================
-- PATIENT IMPORT JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    total_records INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',   -- Pending, Processing, Completed, Failed
    error_details JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant ON patient_import_jobs(tenant_id, created_at DESC) WHERE is_deleted = false;

-- =====================================================
-- DEFAULT SEED DATA (Masters)
-- =====================================================

-- Helper function: seed masters for a tenant
CREATE OR REPLACE FUNCTION seed_patient_masters(p_tenant_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Prefixes
    INSERT INTO patient_prefixes (tenant_id, prefix_name, gender_applicable, sort_order, created_by)
    VALUES
        (p_tenant_id, 'Mr.',   'Male',   1, p_user_id),
        (p_tenant_id, 'Mrs.',  'Female', 2, p_user_id),
        (p_tenant_id, 'Ms.',   'Female', 3, p_user_id),
        (p_tenant_id, 'Dr.',   'Both',   4, p_user_id),
        (p_tenant_id, 'Baby',  'Both',   5, p_user_id),
        (p_tenant_id, 'Master','Male',   6, p_user_id)
    ON CONFLICT (tenant_id, prefix_name) DO NOTHING;

    -- Patient Types
    INSERT INTO patient_types (tenant_id, type_name, type_code, discount_percent, sort_order, created_by)
    VALUES
        (p_tenant_id, 'General',        'GEN',   0,  1, p_user_id),
        (p_tenant_id, 'Senior Citizen', 'SEN',   10, 2, p_user_id),
        (p_tenant_id, 'VIP',            'VIP',   0,  3, p_user_id),
        (p_tenant_id, 'Staff',          'STF',   100,4, p_user_id),
        (p_tenant_id, 'BPL',            'BPL',   50, 5, p_user_id),
        (p_tenant_id, 'Insurance',      'INS',   0,  6, p_user_id)
    ON CONFLICT (tenant_id, type_code) DO NOTHING;

    -- Registration Types
    INSERT INTO registration_types (tenant_id, type_name, type_code, validity_days, registration_fee, sort_order, created_by)
    VALUES
        (p_tenant_id, 'General OPD',  'GEN',  365, 100, 1, p_user_id),
        (p_tenant_id, 'Emergency',    'EMR',  1,   0,   2, p_user_id),
        (p_tenant_id, 'Walk-in',      'WLK',  1,   0,   3, p_user_id),
        (p_tenant_id, 'Annual',       'ANN',  365, 200, 4, p_user_id),
        (p_tenant_id, 'Lifetime',     'LFT',  36500, 500, 5, p_user_id)
    ON CONFLICT (tenant_id, type_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERSION
-- =====================================================

INSERT INTO schema_version (version, description)
VALUES ('4.00', 'Patient Masters, Queue, Renewal, Card Reprint, Audit Log, Import Jobs')
ON CONFLICT DO NOTHING;
