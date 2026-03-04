-- Add Doctor Permissions
INSERT INTO permissions (id, name, code, module, description, created_at) VALUES
(gen_random_uuid(), 'View Doctors', 'doctor.view', 'Doctor', 'View doctor list and details', NOW()),
(gen_random_uuid(), 'Create Doctor', 'doctor.create', 'Doctor', 'Create new doctor', NOW()),
(gen_random_uuid(), 'Update Doctor', 'doctor.update', 'Doctor', 'Update doctor details', NOW()),
(gen_random_uuid(), 'Delete Doctor', 'doctor.delete', 'Doctor', 'Delete doctor', NOW());

-- Assign to SuperAdmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'SuperAdmin' AND p.code IN ('doctor.view', 'doctor.create', 'doctor.update', 'doctor.delete');

-- Assign to HospitalAdmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'HospitalAdmin' AND p.code IN ('doctor.view', 'doctor.create', 'doctor.update', 'doctor.delete');

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Admin' AND p.code IN ('doctor.view', 'doctor.create', 'doctor.update', 'doctor.delete');

-- Assign view to Doctor, Nurse, Receptionist, Accountant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name IN ('Doctor', 'Nurse', 'Receptionist', 'Accountant') AND p.code = 'doctor.view';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('5.00', 'Doctor Approval Permissions')
ON CONFLICT DO NOTHING;
