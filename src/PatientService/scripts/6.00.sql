-- Patient Service Schema v6.00
-- Consent tracking for registration (terms, privacy, health/insurance data sharing)
-- Run AFTER 5.00.sql

ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_terms_accepted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_health_data_sharing BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_recorded_at TIMESTAMP;

COMMENT ON COLUMN patients.consent_terms_accepted IS 'Patient accepted facility terms of service at registration';
COMMENT ON COLUMN patients.consent_privacy_accepted IS 'Patient accepted privacy / data protection policy';
COMMENT ON COLUMN patients.consent_health_data_sharing IS 'Consent to share health data with payers / insurance as applicable';
COMMENT ON COLUMN patients.consent_recorded_at IS 'UTC timestamp when consents were recorded';

INSERT INTO schema_version (version, description)
VALUES ('6.00', 'Patient consent columns')
ON CONFLICT DO NOTHING;
