-- Pharmacy Service Database Schema v1.00
-- PostgreSQL 14+ | Idempotent (safe to re-run)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: drugs
-- =====================================================
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    drug_code VARCHAR(50) NOT NULL,
    drug_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(200) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    reorder_level INT NOT NULL DEFAULT 10,
    is_controlled BOOLEAN NOT NULL DEFAULT false,
    requires_prescription BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_drugs_code UNIQUE (tenant_id, drug_code, is_deleted)
);

CREATE INDEX IF NOT EXISTS idx_drugs_tenant     ON drugs(tenant_id)                WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_drugs_category   ON drugs(tenant_id, category)      WHERE is_deleted = false AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_drugs_name       ON drugs(tenant_id, drug_name)     WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_drugs_controlled ON drugs(tenant_id, is_controlled) WHERE is_deleted = false AND is_controlled = true;

-- =====================================================
-- Table: drug_batches
-- =====================================================
CREATE TABLE IF NOT EXISTS drug_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    drug_id UUID NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_drug_batches_drug   FOREIGN KEY (drug_id) REFERENCES drugs(id),
    CONSTRAINT uq_drug_batches_number UNIQUE (tenant_id, drug_id, batch_number)
);

-- NOTE: expiry_date > NOW() removed — NOW() is not IMMUTABLE, forbidden in index predicates.
--       Filter expiry at query time: AND expiry_date > NOW()
CREATE INDEX IF NOT EXISTS idx_drug_batches_drug   ON drug_batches(drug_id, tenant_id)                              WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_drug_batches_fefo   ON drug_batches(drug_id, tenant_id, expiry_date, manufacture_date) WHERE is_deleted = false AND quantity > 0;
CREATE INDEX IF NOT EXISTS idx_drug_batches_expiry ON drug_batches(tenant_id, expiry_date)                          WHERE is_deleted = false;

-- =====================================================
-- Table: prescriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    prescription_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    doctor_id UUID NOT NULL,
    prescription_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),
    dispensed_at TIMESTAMP,
    dispensed_by VARCHAR(100),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_prescriptions_number UNIQUE (tenant_id, prescription_number)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant    ON prescriptions(tenant_id)                    WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient   ON prescriptions(tenant_id, patient_id)        WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(tenant_id, encounter_id)      WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor    ON prescriptions(tenant_id, doctor_id)         WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_status    ON prescriptions(tenant_id, status)            WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_date      ON prescriptions(tenant_id, prescription_date DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescriptions_dispensed ON prescriptions(tenant_id, dispensed_at)      WHERE is_deleted = false AND status = 'Dispensed';

-- =====================================================
-- Table: prescription_items
-- =====================================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    prescription_id UUID NOT NULL,
    drug_id UUID NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration INT NOT NULL,
    instructions TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_dispensed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    CONSTRAINT fk_prescription_items_drug         FOREIGN KEY (drug_id)         REFERENCES drugs(id)
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescription_items_drug         ON prescription_items(drug_id, tenant_id)         WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_prescription_items_dispensed    ON prescription_items(tenant_id, is_dispensed)    WHERE is_deleted = false;

-- =====================================================
-- Table: dispense_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS dispense_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    prescription_item_id UUID NOT NULL,
    drug_batch_id UUID NOT NULL,
    quantity_dispensed INT NOT NULL,
    dispensed_at TIMESTAMP NOT NULL,
    dispensed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_dispense_logs_item  FOREIGN KEY (prescription_item_id) REFERENCES prescription_items(id),
    CONSTRAINT fk_dispense_logs_batch FOREIGN KEY (drug_batch_id)        REFERENCES drug_batches(id)
);

CREATE INDEX IF NOT EXISTS idx_dispense_logs_item  ON dispense_logs(prescription_item_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_dispense_logs_batch ON dispense_logs(drug_batch_id, tenant_id)        WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_dispense_logs_date  ON dispense_logs(tenant_id, dispensed_at DESC)    WHERE is_deleted = false;

-- =====================================================
-- Table: pharmacy_sequences
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pharmacy_sequences UNIQUE (tenant_id, year)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sequences_tenant_year ON pharmacy_sequences(tenant_id, year);
