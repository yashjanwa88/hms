-- v8.00: Hospital administrators can manage staff and roles (typical HMS expectation).
-- Applies to every tenant's HospitalAdmin role.

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'user.view',
    'user.create',
    'user.update',
    'user.delete',
    'role.manage'
) AND p.is_deleted = false
WHERE r.name = 'HospitalAdmin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES ('8.00', 'RBAC - HospitalAdmin user and role management permissions')
ON CONFLICT (version) DO NOTHING;
