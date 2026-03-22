-- Inventory UI placeholder permission (sidebar + future Inventory API)

INSERT INTO permissions (code, name, description, module) VALUES
('inventory.view', 'View inventory', 'Access inventory and stock management', 'Inventory')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code = 'inventory.view' AND p.is_deleted = false
WHERE r.name IN ('SuperAdmin', 'HospitalAdmin', 'Pharmacist', 'Accountant')
  AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES ('12.00', 'Inventory — inventory.view for UI / future APIs')
ON CONFLICT (version) DO NOTHING;
