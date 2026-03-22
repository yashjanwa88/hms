-- Add Appointment Permissions
INSERT INTO permissions (id, name, code, module, description, created_at) VALUES
(gen_random_uuid(), 'View Appointments', 'appointment.view', 'Appointment', 'View appointment list and details', NOW()),
(gen_random_uuid(), 'Book Appointment', 'appointment.book', 'Appointment', 'Book new appointments', NOW()),
(gen_random_uuid(), 'Cancel Appointment', 'appointment.cancel', 'Appointment', 'Cancel appointments', NOW()),
(gen_random_uuid(), 'Reschedule Appointment', 'appointment.reschedule', 'Appointment', 'Reschedule appointments', NOW()),
(gen_random_uuid(), 'Check-in Appointment', 'appointment.checkin', 'Appointment', 'Check-in patients for appointments', NOW()),
(gen_random_uuid(), 'Complete Appointment', 'appointment.complete', 'Appointment', 'Mark appointments as completed', NOW()),
(gen_random_uuid(), 'View Available Slots', 'appointment.slots', 'Appointment', 'View doctor available time slots', NOW());

-- Assign all appointment permissions to SuperAdmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'SuperAdmin' AND p.code IN ('appointment.view', 'appointment.book', 'appointment.cancel', 'appointment.reschedule', 'appointment.checkin', 'appointment.complete', 'appointment.slots');

-- Assign all appointment permissions to HospitalAdmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'HospitalAdmin' AND p.code IN ('appointment.view', 'appointment.book', 'appointment.cancel', 'appointment.reschedule', 'appointment.checkin', 'appointment.complete', 'appointment.slots');

-- Assign all appointment permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Admin' AND p.code IN ('appointment.view', 'appointment.book', 'appointment.cancel', 'appointment.reschedule', 'appointment.checkin', 'appointment.complete', 'appointment.slots');

-- Assign receptionist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Receptionist' AND p.code IN ('appointment.view', 'appointment.book', 'appointment.cancel', 'appointment.reschedule', 'appointment.checkin', 'appointment.slots');

-- Assign doctor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Doctor' AND p.code IN ('appointment.view', 'appointment.book', 'appointment.cancel', 'appointment.reschedule', 'appointment.complete', 'appointment.slots');

-- Assign nurse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Nurse' AND p.code IN ('appointment.view', 'appointment.checkin', 'appointment.slots');

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('6.00', 'Appointment Permissions')
ON CONFLICT DO NOTHING;