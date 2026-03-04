-- Identity Service Refund Permissions v4.00
-- Database: identity_db
-- Adds refund approval permissions

-- =====================================================
-- ADD REFUND PERMISSIONS
-- =====================================================
INSERT INTO permissions (code, name, description, module) VALUES
('refund.view', 'View Refunds', 'View refund requests', 'Billing'),
('refund.approve', 'Approve Refunds', 'Approve or reject refund requests', 'Billing')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- ASSIGN TO SUPERADMIN (All permissions)
-- =====================================================
DO $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SuperAdmin' LIMIT 1;
    
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT super_admin_role_id, id FROM permissions 
        WHERE code IN ('refund.view', 'refund.approve')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ASSIGN TO HOSPITALADMIN
-- =====================================================
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'HospitalAdmin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT admin_role_id, id FROM permissions 
        WHERE code IN ('refund.view', 'refund.approve')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ASSIGN TO ACCOUNTANT
-- =====================================================
DO $$
DECLARE
    accountant_role_id UUID;
BEGIN
    SELECT id INTO accountant_role_id FROM roles WHERE name = 'Accountant' LIMIT 1;
    
    IF accountant_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT accountant_role_id, id FROM permissions 
        WHERE code IN ('refund.view', 'refund.approve')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ASSIGN TO ADMIN (Generic Admin role)
-- =====================================================
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT admin_role_id, id FROM permissions 
        WHERE code IN ('refund.view', 'refund.approve')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('4.00', 'Refund Approval Permissions')
ON CONFLICT DO NOTHING;
