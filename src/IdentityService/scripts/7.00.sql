-- Identity Service v7.00 — Tenants registry, MFA, session metadata on refresh tokens
-- Database: identity_db

-- =====================================================
-- TENANTS (hospital / clinic — root for multi-tenancy)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    primary_email VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_tenants_code UNIQUE (code)
);

CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

COMMENT ON TABLE tenants IS 'Registered hospitals/clinics — id is used as X-Tenant-Id';

-- =====================================================
-- USER MFA (TOTP) — secret stored protected at application layer
-- =====================================================
CREATE TABLE IF NOT EXISTS user_mfa (
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    secret_protected TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, tenant_id),
    CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_mfa_tenant ON user_mfa(tenant_id);

-- =====================================================
-- REFRESH TOKENS — session metadata (IP, client)
-- =====================================================
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_tenant ON refresh_tokens(user_id, tenant_id);

-- =====================================================
-- SCHEMA VERSION (__migrations picks up filename 7.00)
-- =====================================================
INSERT INTO schema_version (version, description)
VALUES ('7.00', 'Tenants table, MFA, refresh token session metadata')
ON CONFLICT DO NOTHING;
