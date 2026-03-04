-- Identity Service Database Schema v1.00
-- Database: identity_db

-- Create database (run separately if needed)
-- CREATE DATABASE identity_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_roles_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_deleted ON roles(is_deleted);

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uk_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- =====================================================
-- REFRESH TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_deleted ON refresh_tokens(is_deleted);

-- =====================================================
-- LOGIN AUDITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS login_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_login_audits_tenant_id ON login_audits(tenant_id);
CREATE INDEX idx_login_audits_user_id ON login_audits(user_id);
CREATE INDEX idx_login_audits_created_at ON login_audits(created_at);
CREATE INDEX idx_login_audits_is_successful ON login_audits(is_successful);

-- =====================================================
-- SEED DATA - DEFAULT ROLES
-- =====================================================

-- System Tenant (for initial setup)
DO $$
DECLARE
    system_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Insert default roles
    INSERT INTO roles (id, tenant_id, name, description, created_at) VALUES
    (uuid_generate_v4(), system_tenant_id, 'SuperAdmin', 'Super Administrator with full system access', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'HospitalAdmin', 'Hospital Administrator', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'Doctor', 'Medical Doctor', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'Nurse', 'Nursing Staff', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'Receptionist', 'Front Desk Receptionist', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'Accountant', 'Billing and Accounts', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'Pharmacist', 'Pharmacy Staff', NOW()),
    (uuid_generate_v4(), system_tenant_id, 'LabTechnician', 'Laboratory Technician', NOW())
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE roles IS 'User roles and permissions';
COMMENT ON TABLE users IS 'System users with authentication details';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE login_audits IS 'Audit log for login attempts';

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES ('1.00', 'Initial Identity Service schema')
ON CONFLICT DO NOTHING;
