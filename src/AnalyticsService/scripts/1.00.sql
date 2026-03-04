-- AnalyticsService Database Schema Version 1.00
-- Database: analytics_db

-- Table: analytics_revenue_summary (Partitioned by year)
CREATE TABLE IF NOT EXISTS analytics_revenue_summary (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    refund_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    invoice_count INTEGER NOT NULL DEFAULT 0,
    payment_count INTEGER NOT NULL DEFAULT 0,
    period VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, date),
    CONSTRAINT uq_revenue_summary UNIQUE (tenant_id, date, period),
    CONSTRAINT chk_revenue_period CHECK (period IN ('Daily', 'Monthly', 'Yearly'))
) PARTITION BY RANGE (date);

-- Create partitions for current and next 2 years
CREATE TABLE IF NOT EXISTS analytics_revenue_summary_2024 PARTITION OF analytics_revenue_summary
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS analytics_revenue_summary_2025 PARTITION OF analytics_revenue_summary
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS analytics_revenue_summary_2026 PARTITION OF analytics_revenue_summary
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_revenue_tenant_date ON analytics_revenue_summary(tenant_id, date) WHERE is_deleted = false;
CREATE INDEX idx_revenue_period ON analytics_revenue_summary(period, tenant_id) WHERE is_deleted = false;

-- Table: analytics_doctor_performance (Partitioned by year)
CREATE TABLE IF NOT EXISTS analytics_doctor_performance (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    doctor_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    encounter_count INTEGER NOT NULL DEFAULT 0,
    patient_count INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    average_revenue_per_encounter DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, date),
    CONSTRAINT uq_doctor_performance UNIQUE (tenant_id, doctor_id, date)
) PARTITION BY RANGE (date);

CREATE TABLE IF NOT EXISTS analytics_doctor_performance_2024 PARTITION OF analytics_doctor_performance
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS analytics_doctor_performance_2025 PARTITION OF analytics_doctor_performance
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS analytics_doctor_performance_2026 PARTITION OF analytics_doctor_performance
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_doctor_tenant_date ON analytics_doctor_performance(tenant_id, date) WHERE is_deleted = false;
CREATE INDEX idx_doctor_performance ON analytics_doctor_performance(doctor_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_doctor_revenue ON analytics_doctor_performance(total_revenue DESC, tenant_id) WHERE is_deleted = false;

-- Table: analytics_insurance_summary (Partitioned by year)
CREATE TABLE IF NOT EXISTS analytics_insurance_summary (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    total_claims INTEGER NOT NULL DEFAULT 0,
    approved_claims INTEGER NOT NULL DEFAULT 0,
    rejected_claims INTEGER NOT NULL DEFAULT 0,
    settled_claims INTEGER NOT NULL DEFAULT 0,
    total_claim_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    approved_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    settled_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    approval_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, date),
    CONSTRAINT uq_insurance_summary UNIQUE (tenant_id, provider_id, date)
) PARTITION BY RANGE (date);

CREATE TABLE IF NOT EXISTS analytics_insurance_summary_2024 PARTITION OF analytics_insurance_summary
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS analytics_insurance_summary_2025 PARTITION OF analytics_insurance_summary
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS analytics_insurance_summary_2026 PARTITION OF analytics_insurance_summary
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_insurance_tenant_date ON analytics_insurance_summary(tenant_id, date) WHERE is_deleted = false;
CREATE INDEX idx_insurance_provider ON analytics_insurance_summary(provider_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_insurance_approval ON analytics_insurance_summary(approval_rate DESC, tenant_id) WHERE is_deleted = false;

-- Table: analytics_patient_summary (Partitioned by year)
CREATE TABLE IF NOT EXISTS analytics_patient_summary (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    new_patients INTEGER NOT NULL DEFAULT 0,
    total_encounters INTEGER NOT NULL DEFAULT 0,
    total_appointments INTEGER NOT NULL DEFAULT 0,
    average_revenue_per_patient DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, date),
    CONSTRAINT uq_patient_summary UNIQUE (tenant_id, date)
) PARTITION BY RANGE (date);

CREATE TABLE IF NOT EXISTS analytics_patient_summary_2024 PARTITION OF analytics_patient_summary
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS analytics_patient_summary_2025 PARTITION OF analytics_patient_summary
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS analytics_patient_summary_2026 PARTITION OF analytics_patient_summary
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE INDEX idx_patient_tenant_date ON analytics_patient_summary(tenant_id, date) WHERE is_deleted = false;

-- Table: analytics_event_offsets (No partitioning - small table)
CREATE TABLE IF NOT EXISTS analytics_event_offsets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_event_offset UNIQUE (tenant_id, event_type, event_id)
);

CREATE INDEX idx_event_tenant_type ON analytics_event_offsets(tenant_id, event_type) WHERE is_deleted = false;
CREATE INDEX idx_event_processed ON analytics_event_offsets(processed_at DESC) WHERE is_deleted = false;
