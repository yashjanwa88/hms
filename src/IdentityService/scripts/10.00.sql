-- Laboratory module permissions (LaboratoryService RequirePermission)

INSERT INTO permissions (code, name, description, module) VALUES
('lab.view', 'View laboratory', 'View lab tests, orders, and reports', 'Laboratory'),
('lab.test.manage', 'Manage lab tests', 'Create and configure lab test definitions', 'Laboratory'),
('lab.order.create', 'Create lab orders', 'Place laboratory orders for patients', 'Laboratory'),
('lab.sample.collect', 'Collect lab samples', 'Record sample collection', 'Laboratory'),
('lab.order.cancel', 'Cancel lab orders', 'Cancel laboratory orders', 'Laboratory'),
('lab.result.enter', 'Enter lab results', 'Enter or update lab test results', 'Laboratory'),
('lab.order.complete', 'Complete lab orders', 'Mark laboratory orders complete', 'Laboratory')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code LIKE 'lab.%' AND p.is_deleted = false
WHERE r.name = 'SuperAdmin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code LIKE 'lab.%' AND p.is_deleted = false
WHERE r.name = 'HospitalAdmin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'lab.view', 'lab.test.manage', 'lab.order.create', 'lab.order.cancel'
) AND p.is_deleted = false
WHERE r.name = 'Doctor' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'lab.view', 'lab.order.create', 'lab.sample.collect'
) AND p.is_deleted = false
WHERE r.name = 'Nurse' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'lab.view', 'lab.order.create'
) AND p.is_deleted = false
WHERE r.name = 'Receptionist' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'lab.view', 'lab.sample.collect', 'lab.result.enter', 'lab.order.complete'
) AND p.is_deleted = false
WHERE r.name = 'LabTechnician' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES ('10.00', 'Laboratory — lab.* permissions')
ON CONFLICT (version) DO NOTHING;
