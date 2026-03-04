-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    encounter_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal NUMERIC(18,2) DEFAULT 0,
    tax NUMERIC(18,2) DEFAULT 0,
    discount NUMERIC(18,2) DEFAULT 0,
    grand_total NUMERIC(18,2) DEFAULT 0,
    paid_amount NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Cancelled')),
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, encounter_id)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('Consultation', 'Lab', 'Medicine', 'Procedure', 'Other')),
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL,
    total_price NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Invoice sequences table (for number generation)
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tenant_code VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_encounter ON invoices(encounter_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id) WHERE is_deleted = false;


-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES ('1.00', 'Initial Billing Service schema')
ON CONFLICT DO NOTHING;