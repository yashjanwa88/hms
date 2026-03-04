-- Audit Service Database Schema v1.00
-- Database: audit_db
-- IMMUTABLE AUDIT LOG - NO UPDATES/DELETES ALLOWED

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AUDIT LOGS TABLE (IMMUTABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    
    service_name VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, MERGE, PAYMENT, LOGIN, FAILED_LOGIN
    
    old_data JSONB,
    new_data JSONB,
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    correlation_id VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_service ON audit_logs(service_name);
CREATE INDEX idx_audit_correlation ON audit_logs(correlation_id);

-- JSONB indexes for fast queries
CREATE INDEX idx_audit_old_data ON audit_logs USING gin(old_data);
CREATE INDEX idx_audit_new_data ON audit_logs USING gin(new_data);

-- =====================================================
-- SECURITY: PREVENT UPDATES/DELETES
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trigger_prevent_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system activities';
COMMENT ON COLUMN audit_logs.action IS 'CREATE, UPDATE, DELETE, MERGE, PAYMENT, LOGIN, FAILED_LOGIN';
COMMENT ON COLUMN audit_logs.old_data IS 'Previous state (JSONB)';
COMMENT ON COLUMN audit_logs.new_data IS 'New state (JSONB)';
COMMENT ON COLUMN audit_logs.correlation_id IS 'X-Request-Id for request tracing';

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('1.00', 'Initial Audit Service schema - Immutable audit logs')
ON CONFLICT DO NOTHING;
