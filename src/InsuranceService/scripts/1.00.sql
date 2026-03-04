-- InsuranceService Database Schema Version 1.00
-- Database: insurance_db

-- Table: insurance_providers
CREATE TABLE IF NOT EXISTS insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_provider_code UNIQUE (tenant_id, provider_code)
);

CREATE INDEX idx_providers_tenant ON insurance_providers(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_providers_active ON insurance_providers(is_active, tenant_id) WHERE is_deleted = false;

-- Table: insurance_policies
CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
    used_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    available_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_policies_provider FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
    CONSTRAINT uq_policy_number UNIQUE (tenant_id, policy_number),
    CONSTRAINT chk_policy_status CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    CONSTRAINT chk_policy_type CHECK (policy_type IN ('Individual', 'Family', 'Corporate')),
    CONSTRAINT chk_policy_amounts CHECK (coverage_amount >= 0 AND used_amount >= 0 AND available_amount >= 0),
    CONSTRAINT chk_policy_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_policies_tenant ON insurance_policies(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_policies_patient ON insurance_policies(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_policies_provider ON insurance_policies(provider_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_policies_status ON insurance_policies(status, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_policies_dates ON insurance_policies(start_date, end_date, tenant_id) WHERE is_deleted = false;

-- Table: pre_authorizations
CREATE TABLE IF NOT EXISTS pre_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    preauth_number VARCHAR(50) NOT NULL,
    policy_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    encounter_id UUID,
    request_date TIMESTAMP NOT NULL,
    estimated_amount DECIMAL(12,2) NOT NULL,
    treatment_type VARCHAR(100) NOT NULL,
    diagnosis TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_amount DECIMAL(12,2),
    rejection_reason TEXT,
    response_date TIMESTAMP,
    reviewed_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_preauth_policy FOREIGN KEY (policy_id) REFERENCES insurance_policies(id),
    CONSTRAINT uq_preauth_number UNIQUE (tenant_id, preauth_number),
    CONSTRAINT chk_preauth_status CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT chk_preauth_amount CHECK (estimated_amount > 0)
);

CREATE INDEX idx_preauth_tenant ON pre_authorizations(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_preauth_policy ON pre_authorizations(policy_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_preauth_patient ON pre_authorizations(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_preauth_status ON pre_authorizations(status, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_preauth_date ON pre_authorizations(request_date, tenant_id) WHERE is_deleted = false;

-- Table: insurance_claims
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    claim_number VARCHAR(50) NOT NULL,
    policy_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    preauth_id UUID,
    invoice_id UUID,
    claim_date TIMESTAMP NOT NULL,
    claim_amount DECIMAL(12,2) NOT NULL,
    claim_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted',
    approved_amount DECIMAL(12,2),
    rejection_reason TEXT,
    review_date TIMESTAMP,
    reviewed_by UUID,
    documents TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_claims_policy FOREIGN KEY (policy_id) REFERENCES insurance_policies(id),
    CONSTRAINT fk_claims_preauth FOREIGN KEY (preauth_id) REFERENCES pre_authorizations(id),
    CONSTRAINT uq_claim_number UNIQUE (tenant_id, claim_number),
    CONSTRAINT chk_claim_status CHECK (status IN ('Submitted', 'UnderReview', 'Approved', 'Rejected', 'Settled')),
    CONSTRAINT chk_claim_type CHECK (claim_type IN ('Cashless', 'Reimbursement')),
    CONSTRAINT chk_claim_amount CHECK (claim_amount > 0)
);

CREATE INDEX idx_claims_tenant ON insurance_claims(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_policy ON insurance_claims(policy_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_patient ON insurance_claims(patient_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_invoice ON insurance_claims(invoice_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_preauth ON insurance_claims(preauth_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_status ON insurance_claims(status, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_claims_date ON insurance_claims(claim_date, tenant_id) WHERE is_deleted = false;

-- Table: claim_settlements
CREATE TABLE IF NOT EXISTS claim_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    claim_id UUID NOT NULL,
    settlement_number VARCHAR(50) NOT NULL,
    settlement_date TIMESTAMP NOT NULL,
    settled_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_settlements_claim FOREIGN KEY (claim_id) REFERENCES insurance_claims(id),
    CONSTRAINT uq_settlement_number UNIQUE (tenant_id, settlement_number),
    CONSTRAINT uq_settlement_claim UNIQUE (tenant_id, claim_id),
    CONSTRAINT chk_settlement_amount CHECK (settled_amount > 0)
);

CREATE INDEX idx_settlements_tenant ON claim_settlements(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_settlements_claim ON claim_settlements(claim_id, tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_settlements_date ON claim_settlements(settlement_date, tenant_id) WHERE is_deleted = false;

-- Table: insurance_sequences
CREATE TABLE IF NOT EXISTS insurance_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    year INTEGER NOT NULL,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_insurance_sequence UNIQUE (tenant_id, year)
);

CREATE INDEX idx_insurance_sequences_tenant_year ON insurance_sequences(tenant_id, year) WHERE is_deleted = false;
