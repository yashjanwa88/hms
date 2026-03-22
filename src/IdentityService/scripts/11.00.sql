-- Doctor schedule, Pharmacy, Insurance, Analytics (permission-based APIs)

INSERT INTO permissions (code, name, description, module) VALUES
('doctor.schedule.manage', 'Manage doctor schedule', 'Doctor availability and leave', 'Doctor'),
('pharmacy.drug.view', 'View drugs', 'View pharmacy drug catalog', 'Pharmacy'),
('pharmacy.drug.manage', 'Manage drugs and batches', 'Create/update drugs and stock batches', 'Pharmacy'),
('pharmacy.prescription.create', 'Create prescriptions', 'Create or cancel prescriptions', 'Pharmacy'),
('pharmacy.prescription.view', 'View prescriptions', 'View prescriptions and receipts', 'Pharmacy'),
('pharmacy.dispense', 'Dispense medications', 'Verify and dispense prescriptions', 'Pharmacy'),
('pharmacy.report.sales', 'Pharmacy sales reports', 'Daily pharmacy sales reporting', 'Pharmacy'),
('pharmacy.report.inventory', 'Pharmacy inventory reports', 'Low stock and inventory reports', 'Pharmacy'),
('insurance.view', 'View insurance', 'View providers, policies, preauth, claims', 'Insurance'),
('insurance.provider.create', 'Create insurance providers', 'Register insurance providers', 'Insurance'),
('insurance.policy.create', 'Create insurance policies', 'Attach patient insurance policies', 'Insurance'),
('insurance.preauth.create', 'Create pre-authorizations', 'Submit pre-auth requests', 'Insurance'),
('insurance.preauth.approve', 'Approve pre-authorizations', 'Approve or reject pre-auth', 'Insurance'),
('insurance.claim.create', 'Create insurance claims', 'Submit insurance claims', 'Insurance'),
('insurance.claim.admin', 'Manage claim status', 'Update insurance claim status', 'Insurance'),
('insurance.claim.settle', 'Settle insurance claims', 'Record claim settlements', 'Insurance'),
('analytics.financial', 'Financial analytics', 'Revenue and insurance analytics', 'Analytics'),
('analytics.clinical', 'Clinical analytics', 'Doctor and patient operational analytics', 'Analytics'),
('analytics.dashboard', 'Analytics dashboard', 'Consolidated analytics dashboard', 'Analytics')
ON CONFLICT (code) DO NOTHING;

-- SuperAdmin: all codes above
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'doctor.schedule.manage',
    'pharmacy.drug.view', 'pharmacy.drug.manage', 'pharmacy.prescription.create', 'pharmacy.prescription.view',
    'pharmacy.dispense', 'pharmacy.report.sales', 'pharmacy.report.inventory',
    'insurance.view', 'insurance.provider.create', 'insurance.policy.create', 'insurance.preauth.create',
    'insurance.preauth.approve', 'insurance.claim.create', 'insurance.claim.admin', 'insurance.claim.settle',
    'analytics.financial', 'analytics.clinical', 'analytics.dashboard'
) AND p.is_deleted = false
WHERE r.name = 'SuperAdmin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HospitalAdmin: all except we mirror SuperAdmin for these modules
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'doctor.schedule.manage',
    'pharmacy.drug.view', 'pharmacy.drug.manage', 'pharmacy.prescription.create', 'pharmacy.prescription.view',
    'pharmacy.dispense', 'pharmacy.report.sales', 'pharmacy.report.inventory',
    'insurance.view', 'insurance.provider.create', 'insurance.policy.create', 'insurance.preauth.create',
    'insurance.preauth.approve', 'insurance.claim.create', 'insurance.claim.admin', 'insurance.claim.settle',
    'analytics.financial', 'analytics.clinical', 'analytics.dashboard'
) AND p.is_deleted = false
WHERE r.name = 'HospitalAdmin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Doctor
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'doctor.schedule.manage',
    'pharmacy.drug.view', 'pharmacy.prescription.create', 'pharmacy.prescription.view',
    'insurance.view', 'insurance.preauth.create',
    'analytics.clinical', 'analytics.dashboard'
) AND p.is_deleted = false
WHERE r.name = 'Doctor' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'pharmacy.drug.view', 'pharmacy.prescription.view',
    'insurance.view', 'insurance.preauth.create'
) AND p.is_deleted = false
WHERE r.name = 'Nurse' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'insurance.view', 'insurance.policy.create', 'insurance.claim.create'
) AND p.is_deleted = false
WHERE r.name = 'Receptionist' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Pharmacist
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'pharmacy.drug.view', 'pharmacy.drug.manage', 'pharmacy.prescription.view',
    'pharmacy.dispense', 'pharmacy.report.sales', 'pharmacy.report.inventory'
) AND p.is_deleted = false
WHERE r.name = 'Pharmacist' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Accountant
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'insurance.view', 'insurance.provider.create', 'insurance.policy.create',
    'insurance.preauth.approve', 'insurance.claim.create', 'insurance.claim.admin', 'insurance.claim.settle',
    'pharmacy.report.sales',
    'analytics.financial', 'analytics.dashboard'
) AND p.is_deleted = false
WHERE r.name = 'Accountant' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin role (legacy) — align with HospitalAdmin for these modules
INSERT INTO role_permissions (id, role_id, permission_id, created_at, is_deleted)
SELECT uuid_generate_v4(), r.id, p.id, NOW(), false
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'doctor.schedule.manage',
    'pharmacy.drug.view', 'pharmacy.drug.manage', 'pharmacy.prescription.create', 'pharmacy.prescription.view',
    'pharmacy.dispense', 'pharmacy.report.sales', 'pharmacy.report.inventory',
    'insurance.view', 'insurance.provider.create', 'insurance.policy.create', 'insurance.preauth.create',
    'insurance.preauth.approve', 'insurance.claim.create', 'insurance.claim.admin', 'insurance.claim.settle',
    'analytics.financial', 'analytics.clinical', 'analytics.dashboard'
) AND p.is_deleted = false
WHERE r.name = 'Admin' AND r.is_deleted = false
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES ('11.00', 'Doctor schedule, Pharmacy, Insurance, Analytics permissions')
ON CONFLICT (version) DO NOTHING;
