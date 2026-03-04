-- Pharmacy Service Database Schema v1.00
-- PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: drugs
-- Description: Master drug catalog
-- =====================================================
CREATE TABLE drugs (
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

CREATE INDEX idx_drugs_tenant ON drugs(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_drugs_category ON drugs(tenant_id, category) WHERE is_deleted = false AND is_active = true;
CREATE INDEX idx_drugs_name ON drugs(tenant_id, drug_name) WHERE is_deleted = false;
CREATE INDEX idx_drugs_controlled ON drugs(tenant_id, is_controlled) WHERE is_deleted = false AND is_controlled = true;

-- =====================================================
-- Table: drug_batches
-- Description: Drug inventory batches with FEFO support
-- =====================================================
CREATE TABLE drug_batches (
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
    CONSTRAINT fk_drug_batches_drug FOREIGN KEY (drug_id) REFERENCES drugs(id),
    CONSTRAINT uq_drug_batches_number UNIQUE (tenant_id, drug_id, batch_number)
);

CREATE INDEX idx_drug_batches_drug ON drug_batches(drug_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_drug_batches_fefo ON drug_batches(drug_id, tenant_id, expiry_date, manufacture_date) 
    WHERE is_deleted = false AND quantity > 0 AND expiry_date > NOW();
CREATE INDEX idx_drug_batches_expiry ON drug_batches(tenant_id, expiry_date) WHERE is_deleted = false;

-- =====================================================
-- Table: prescriptions
-- Description: Prescription orders
-- =====================================================
CREATE TABLE prescriptions (
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

CREATE INDEX idx_prescriptions_tenant ON prescriptions(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_patient ON prescriptions(tenant_id, patient_id) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_encounter ON prescriptions(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_doctor ON prescriptions(tenant_id, doctor_id) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_status ON prescriptions(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_date ON prescriptions(tenant_id, prescription_date DESC) WHERE is_deleted = false;
CREATE INDEX idx_prescriptions_dispensed ON prescriptions(tenant_id, dispensed_at) WHERE is_deleted = false AND status = 'Dispensed';

-- =====================================================
-- Table: prescription_items
-- Description: Individual drug items in prescription
-- =====================================================
CREATE TABLE prescription_items (
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
    CONSTRAINT fk_prescription_items_drug FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_prescription_items_drug ON prescription_items(drug_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_prescription_items_dispensed ON prescription_items(tenant_id, is_dispensed) WHERE is_deleted = false;

-- =====================================================
-- Table: dispense_logs
-- Description: Audit trail for drug dispensing
-- =====================================================
CREATE TABLE dispense_logs (
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
    CONSTRAINT fk_dispense_logs_item FOREIGN KEY (prescription_item_id) REFERENCES prescription_items(id),
    CONSTRAINT fk_dispense_logs_batch FOREIGN KEY (drug_batch_id) REFERENCES drug_batches(id)
);

CREATE INDEX idx_dispense_logs_item ON dispense_logs(prescription_item_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_dispense_logs_batch ON dispense_logs(drug_batch_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_dispense_logs_date ON dispense_logs(tenant_id, dispensed_at DESC) WHERE is_deleted = false;

-- =====================================================
-- Table: pharmacy_sequences
-- Description: Atomic sequence generation for prescription numbers
-- =====================================================
CREATE TABLE pharmacy_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pharmacy_sequences UNIQUE (tenant_id, year)
);

CREATE INDEX idx_pharmacy_sequences_tenant_year ON pharmacy_sequences(tenant_id, year);

-- =====================================================
-- Performance Notes
-- =====================================================
-- 1. FEFO Index: (drug_id, tenant_id, expiry_date, manufacture_date) for optimal batch selection
-- 2. Partial indexes with WHERE is_deleted = false reduce index size
-- 3. Composite indexes on (tenant_id, key_column) for fast tenant-scoped queries
-- 4. Foreign keys ensure referential integrity
-- 5. Unique constraints include tenant_id for multi-tenancy
-- 6. pharmacy_sequences uses UPSERT for atomic prescription number generation
-- 7. Dispensed prescriptions indexed by dispensed_at for sales reports
-- 8. Designed for 20,000+ prescriptions/day with sub-second query times

-- =====================================================
-- Sample Data: Common Drugs
-- =====================================================
-- Note: Insert sample data with appropriate tenant_id after tenant setup

-- Paracetamol
-- INSERT INTO drugs (id, tenant_id, drug_code, drug_name, generic_name, category, manufacturer, strength, dosage_form, unit_price, reorder_level, is_controlled, requires_prescription, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'PARA500', 'Paracetamol', 'Acetaminophen', 'Analgesic', 'Generic Pharma', '500mg', 'Tablet', 2.00, 100, false, false, true, 'system', false);

-- Amoxicillin
-- INSERT INTO drugs (id, tenant_id, drug_code, drug_name, generic_name, category, manufacturer, strength, dosage_form, unit_price, reorder_level, is_controlled, requires_prescription, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'AMOX500', 'Amoxicillin', 'Amoxicillin', 'Antibiotic', 'Generic Pharma', '500mg', 'Capsule', 5.00, 50, false, true, true, 'system', false);

-- Metformin
-- INSERT INTO drugs (id, tenant_id, drug_code, drug_name, generic_name, category, manufacturer, strength, dosage_form, unit_price, reorder_level, is_controlled, requires_prescription, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'METF500', 'Metformin', 'Metformin HCl', 'Antidiabetic', 'Generic Pharma', '500mg', 'Tablet', 3.00, 100, false, true, true, 'system', false);

-- =====================================================
-- Maintenance Queries
-- =====================================================

-- Check stock levels
-- SELECT d.drug_name, d.reorder_level, COALESCE(SUM(db.quantity), 0) as available_stock
-- FROM drugs d
-- LEFT JOIN drug_batches db ON d.id = db.drug_id AND db.expiry_date > NOW() AND db.is_deleted = false
-- WHERE d.tenant_id = '<tenant_id>' AND d.is_deleted = false
-- GROUP BY d.id, d.drug_name, d.reorder_level
-- HAVING COALESCE(SUM(db.quantity), 0) < d.reorder_level;

-- Check expired batches
-- SELECT d.drug_name, db.batch_number, db.expiry_date, db.quantity
-- FROM drug_batches db
-- INNER JOIN drugs d ON db.drug_id = d.id
-- WHERE db.tenant_id = '<tenant_id>' AND db.expiry_date <= NOW() AND db.quantity > 0 AND db.is_deleted = false;

-- Daily sales summary
-- SELECT DATE(dispensed_at) as date, COUNT(*) as prescriptions, SUM(total_amount) as revenue
-- FROM prescriptions
-- WHERE tenant_id = '<tenant_id>' AND status = 'Dispensed' AND is_deleted = false
-- GROUP BY DATE(dispensed_at)
-- ORDER BY date DESC;

-- Top selling drugs
-- SELECT d.drug_name, SUM(pi.quantity) as total_quantity, SUM(pi.amount) as total_revenue
-- FROM prescription_items pi
-- INNER JOIN prescriptions p ON pi.prescription_id = p.id
-- INNER JOIN drugs d ON pi.drug_id = d.id
-- WHERE pi.tenant_id = '<tenant_id>' AND p.status = 'Dispensed' AND pi.is_deleted = false
-- GROUP BY d.drug_name
-- ORDER BY total_revenue DESC
-- LIMIT 20;
