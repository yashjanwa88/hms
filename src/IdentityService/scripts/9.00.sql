-- Visit / IPD conversion permission (VisitService RequirePermission)

INSERT INTO permissions (code, name, description, module) VALUES
(
    'visit.ipd_convert',
    'Convert visit to IPD',
    'Convert OPD visit to inpatient admission',
    'Visit'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code = 'visit.ipd_convert' AND p.is_deleted = false
WHERE r.name IN ('SuperAdmin', 'HospitalAdmin', 'Doctor', 'Nurse')
  AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES ('9.00', 'Visit — IPD conversion permission')
ON CONFLICT (version) DO NOTHING;
