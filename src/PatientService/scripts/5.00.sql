-- Patient Service Schema v5.00
-- New: Patient Documents table
-- NOTE: Run AFTER 4.00.sql

CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Medical',   -- Medical, Insurance, Identity, Report, Prescription, Other
    sub_category VARCHAR(100),
    description TEXT,
    document_date DATE,
    expiry_date DATE,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    access_level VARCHAR(20) NOT NULL DEFAULT 'Private', -- Public, Private, Restricted
    tags TEXT,                                           -- comma-separated
    version INT NOT NULL DEFAULT 1,
    parent_file_id UUID,
    is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
    download_count INT NOT NULL DEFAULT 0,
    last_accessed_date TIMESTAMP,
    last_accessed_by UUID,
    uploaded_by UUID NOT NULL,
    uploaded_by_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_patient_docs_patient  ON patient_documents(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_patient_docs_tenant   ON patient_documents(tenant_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_patient_docs_category ON patient_documents(tenant_id, category) WHERE is_deleted = false;

-- Storage directory config (used by app, not DB)
-- Files stored at: uploads/patient-documents/{tenant_id}/{patient_id}/{file_name}

INSERT INTO schema_version (version, description)
VALUES ('5.00', 'Patient Documents table')
ON CONFLICT DO NOTHING;
