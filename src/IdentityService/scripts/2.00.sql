-- Identity Service RBAC Enhancement v2.00
-- Database: identity_db
-- Adds permission-based access control

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_module ON permissions(module);

-- =====================================================
-- ROLE_PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
    CONSTRAINT uk_role_permissions UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- =====================================================
-- SEED PERMISSIONS
-- =====================================================

-- Patient Module
INSERT INTO permissions (code, name, description, module) VALUES
('patient.view', 'View Patients', 'View patient list and details', 'Patient'),
('patient.create', 'Create Patient', 'Register new patients', 'Patient'),
('patient.update', 'Update Patient', 'Edit patient information', 'Patient'),
('patient.delete', 'Delete Patient', 'Deactivate patients', 'Patient'),
('patient.merge', 'Merge Patients', 'Merge duplicate patient records', 'Patient')
ON CONFLICT (code) DO NOTHING;

-- Billing Module
INSERT INTO permissions (code, name, description, module) VALUES
('invoice.view', 'View Invoices', 'View invoice list and details', 'Billing'),
('invoice.create', 'Create Invoice', 'Generate new invoices', 'Billing'),
('invoice.edit', 'Edit Invoice', 'Modify invoice items', 'Billing'),
('invoice.delete', 'Delete Invoice', 'Cancel invoices', 'Billing'),
('payment.record', 'Record Payment', 'Record patient payments', 'Billing'),
('invoice.refund', 'Process Refund', 'Process payment refunds', 'Billing')
ON CONFLICT (code) DO NOTHING;

-- Encounter Module
INSERT INTO permissions (code, name, description, module) VALUES
('encounter.view', 'View Encounters', 'View patient visits', 'Encounter'),
('encounter.create', 'Create Encounter', 'Register patient visits', 'Encounter'),
('encounter.update', 'Update Encounter', 'Update visit details', 'Encounter')
ON CONFLICT (code) DO NOTHING;

-- User Management Module
INSERT INTO permissions (code, name, description, module) VALUES
('user.view', 'View Users', 'View user list', 'User'),
('user.create', 'Create User', 'Add new users', 'User'),
('user.update', 'Update User', 'Edit user details', 'User'),
('user.delete', 'Delete User', 'Deactivate users', 'User'),
('role.manage', 'Manage Roles', 'Manage roles and permissions', 'User')
ON CONFLICT (code) DO NOTHING;

-- Audit Module
INSERT INTO permissions (code, name, description, module) VALUES
('audit.view', 'View Audit Logs', 'View system audit logs', 'Audit')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- SuperAdmin - All permissions
DO $$
DECLARE
    super_admin_role_id UUID;
    perm RECORD;
BEGIN
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SuperAdmin' LIMIT 1;
    
    IF super_admin_role_id IS NOT NULL THEN
        FOR perm IN SELECT id FROM permissions WHERE is_deleted = false
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (super_admin_role_id, perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- HospitalAdmin - Most permissions except user management
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'HospitalAdmin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT admin_role_id, id FROM permissions 
        WHERE code IN (
            'patient.view', 'patient.create', 'patient.update', 'patient.merge',
            'invoice.view', 'invoice.create', 'invoice.edit', 'payment.record', 'invoice.refund',
            'encounter.view', 'encounter.create', 'encounter.update',
            'audit.view'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Doctor - Patient and encounter access
DO $$
DECLARE
    doctor_role_id UUID;
BEGIN
    SELECT id INTO doctor_role_id FROM roles WHERE name = 'Doctor' LIMIT 1;
    
    IF doctor_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT doctor_role_id, id FROM permissions 
        WHERE code IN (
            'patient.view', 'patient.create', 'patient.update',
            'encounter.view', 'encounter.create', 'encounter.update',
            'invoice.view'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Receptionist - Patient registration and basic billing
DO $$
DECLARE
    receptionist_role_id UUID;
BEGIN
    SELECT id INTO receptionist_role_id FROM roles WHERE name = 'Receptionist' LIMIT 1;
    
    IF receptionist_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT receptionist_role_id, id FROM permissions 
        WHERE code IN (
            'patient.view', 'patient.create', 'patient.update',
            'encounter.view', 'encounter.create',
            'invoice.view'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Accountant - Full billing access
DO $$
DECLARE
    accountant_role_id UUID;
BEGIN
    SELECT id INTO accountant_role_id FROM roles WHERE name = 'Accountant' LIMIT 1;
    
    IF accountant_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT accountant_role_id, id FROM permissions 
        WHERE code IN (
            'patient.view',
            'invoice.view', 'invoice.create', 'invoice.edit', 'payment.record', 'invoice.refund',
            'encounter.view',
            'audit.view'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE permissions IS 'System permissions for RBAC';
COMMENT ON TABLE role_permissions IS 'Role to permission mapping';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('2.00', 'RBAC - Permission-based access control')
ON CONFLICT DO NOTHING;
