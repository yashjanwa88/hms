-- Identity Service Security Enhancement v3.00
-- Database: identity_db
-- Adds account lockout and password policy

-- =====================================================
-- ADD SECURITY FIELDS TO USERS TABLE
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- =====================================================
-- PASSWORD POLICY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    min_length INT DEFAULT 8,
    require_uppercase BOOLEAN DEFAULT TRUE,
    require_lowercase BOOLEAN DEFAULT TRUE,
    require_numbers BOOLEAN DEFAULT TRUE,
    require_special_chars BOOLEAN DEFAULT FALSE,
    max_failed_attempts INT DEFAULT 5,
    lockout_duration_minutes INT DEFAULT 30,
    password_expiry_days INT DEFAULT 90,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id)
);

-- =====================================================
-- SEED DEFAULT PASSWORD POLICY
-- =====================================================
INSERT INTO password_policies (tenant_id, min_length, max_failed_attempts, lockout_duration_minutes)
VALUES ('00000000-0000-0000-0000-000000000000', 6, 5, 30)
ON CONFLICT (tenant_id) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_failed_attempts ON users(failed_login_attempts);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_password_policies_tenant ON password_policies(tenant_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp';
COMMENT ON COLUMN users.force_password_change IS 'User must change password on next login';
COMMENT ON TABLE password_policies IS 'Tenant-specific password and security policies';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('3.00', 'Security Enhancement - Account lockout and password policy')
ON CONFLICT DO NOTHING;