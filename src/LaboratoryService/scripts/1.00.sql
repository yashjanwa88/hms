-- Laboratory Service Database Schema v1.00
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: lab_tests
-- Description: Master catalog of laboratory tests
-- =====================================================
CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    turnaround_time_hours INT NOT NULL,
    sample_type VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_lab_tests_code UNIQUE (tenant_id, test_code, is_deleted)
);

CREATE INDEX idx_lab_tests_tenant ON lab_tests(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_tests_category ON lab_tests(tenant_id, category) WHERE is_deleted = false AND is_active = true;
CREATE INDEX idx_lab_tests_active ON lab_tests(tenant_id, is_active) WHERE is_deleted = false;

-- =====================================================
-- Table: lab_test_parameters
-- Description: Parameters/components of each lab test
-- =====================================================
CREATE TABLE lab_test_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lab_test_id UUID NOT NULL,
    parameter_name VARCHAR(200) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_min DECIMAL(10,2),
    reference_max DECIMAL(10,2),
    critical_min DECIMAL(10,2),
    critical_max DECIMAL(10,2),
    reference_range VARCHAR(200),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_lab_test_parameters_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id)
);

CREATE INDEX idx_lab_test_parameters_test ON lab_test_parameters(lab_test_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_test_parameters_tenant ON lab_test_parameters(tenant_id) WHERE is_deleted = false;

-- =====================================================
-- Table: lab_orders
-- Description: Laboratory test orders
-- =====================================================
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    doctor_id UUID NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL, -- Pending, SampleCollected, InProgress, Completed, Cancelled
    priority VARCHAR(20) NOT NULL DEFAULT 'Routine', -- Routine, Urgent, STAT
    sample_collected_at TIMESTAMP,
    sample_collected_by VARCHAR(100),
    completed_at TIMESTAMP,
    completed_by VARCHAR(100),
    clinical_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_lab_orders_number UNIQUE (tenant_id, order_number)
);

CREATE INDEX idx_lab_orders_tenant ON lab_orders(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_patient ON lab_orders(tenant_id, patient_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_encounter ON lab_orders(tenant_id, encounter_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_doctor ON lab_orders(tenant_id, doctor_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_status ON lab_orders(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_date ON lab_orders(tenant_id, order_date DESC) WHERE is_deleted = false;
CREATE INDEX idx_lab_orders_priority ON lab_orders(tenant_id, priority, status) WHERE is_deleted = false;

-- =====================================================
-- Table: lab_order_items
-- Description: Individual test items within an order
-- =====================================================
CREATE TABLE lab_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lab_order_id UUID NOT NULL,
    lab_test_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, InProgress, Completed
    result_entered_at TIMESTAMP,
    result_entered_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_lab_order_items_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id),
    CONSTRAINT fk_lab_order_items_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id)
);

CREATE INDEX idx_lab_order_items_order ON lab_order_items(lab_order_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_order_items_test ON lab_order_items(lab_test_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_order_items_status ON lab_order_items(tenant_id, status) WHERE is_deleted = false;

-- =====================================================
-- Table: lab_results
-- Description: Test results for each parameter
-- =====================================================
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lab_order_item_id UUID NOT NULL,
    lab_test_parameter_id UUID NOT NULL,
    value TEXT,
    is_abnormal BOOLEAN NOT NULL DEFAULT false,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_lab_results_item FOREIGN KEY (lab_order_item_id) REFERENCES lab_order_items(id),
    CONSTRAINT fk_lab_results_parameter FOREIGN KEY (lab_test_parameter_id) REFERENCES lab_test_parameters(id)
);

CREATE INDEX idx_lab_results_item ON lab_results(lab_order_item_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_results_parameter ON lab_results(lab_test_parameter_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_lab_results_abnormal ON lab_results(tenant_id, is_abnormal) WHERE is_deleted = false AND is_abnormal = true;
CREATE INDEX idx_lab_results_critical ON lab_results(tenant_id, is_critical) WHERE is_deleted = false AND is_critical = true;

-- =====================================================
-- Table: lab_sequences
-- Description: Atomic sequence generation for order numbers
-- =====================================================
CREATE TABLE lab_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lab_sequences UNIQUE (tenant_id, year)
);

CREATE INDEX idx_lab_sequences_tenant_year ON lab_sequences(tenant_id, year);

-- =====================================================
-- Sample Data: Common Lab Tests
-- =====================================================
-- Note: Insert sample data with appropriate tenant_id after tenant setup

-- Complete Blood Count (CBC)
-- INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'CBC', 'Complete Blood Count', 'Hematology', 500.00, 4, 'Blood', true, 'system', false);

-- Lipid Profile
-- INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'LIPID', 'Lipid Profile', 'Biochemistry', 800.00, 6, 'Blood', true, 'system', false);

-- Liver Function Test (LFT)
-- INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'LFT', 'Liver Function Test', 'Biochemistry', 700.00, 6, 'Blood', true, 'system', false);

-- Kidney Function Test (KFT)
-- INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'KFT', 'Kidney Function Test', 'Biochemistry', 650.00, 6, 'Blood', true, 'system', false);

-- Thyroid Profile
-- INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
-- VALUES (gen_random_uuid(), '<tenant_id>', 'THYROID', 'Thyroid Profile', 'Endocrinology', 900.00, 24, 'Blood', true, 'system', false);

-- =====================================================
-- Performance Notes
-- =====================================================
-- 1. All tables include tenant_id for multi-tenancy isolation
-- 2. Composite indexes on (tenant_id, key_column) for fast queries
-- 3. Partial indexes with WHERE is_deleted = false to reduce index size
-- 4. Foreign keys ensure referential integrity
-- 5. Unique constraints include tenant_id for tenant isolation
-- 6. lab_sequences table uses UPSERT for atomic order number generation
-- 7. Status columns use VARCHAR for flexibility and readability
-- 8. Timestamp columns for audit trail
-- 9. Designed for 500+ hospitals processing 15,000+ lab orders per day
-- 10. Consider partitioning lab_orders and lab_results by date for large datasets

-- =====================================================
-- Maintenance Queries
-- =====================================================

-- Check order statistics by status
-- SELECT tenant_id, status, COUNT(*) as order_count
-- FROM lab_orders
-- WHERE is_deleted = false
-- GROUP BY tenant_id, status;

-- Find critical results
-- SELECT lo.order_number, lt.test_name, ltp.parameter_name, lr.value, lr.comments
-- FROM lab_results lr
-- JOIN lab_order_items loi ON lr.lab_order_item_id = loi.id
-- JOIN lab_orders lo ON loi.lab_order_id = lo.id
-- JOIN lab_tests lt ON loi.lab_test_id = lt.id
-- JOIN lab_test_parameters ltp ON lr.lab_test_parameter_id = ltp.id
-- WHERE lr.is_critical = true AND lr.is_deleted = false;

-- Average turnaround time by test
-- SELECT lt.test_name, 
--        AVG(EXTRACT(EPOCH FROM (lo.completed_at - lo.order_date))/3600) as avg_hours
-- FROM lab_orders lo
-- JOIN lab_order_items loi ON lo.id = loi.lab_order_id
-- JOIN lab_tests lt ON loi.lab_test_id = lt.id
-- WHERE lo.status = 'Completed' AND lo.is_deleted = false
-- GROUP BY lt.test_name;
