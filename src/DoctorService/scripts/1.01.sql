-- Doctor Service Database Migration v1.01
-- Add missing columns for profile picture and max patients per day

-- Add new columns to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS max_patients_per_day INTEGER NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS profile_picture_path VARCHAR(500);

-- Add comments for new columns
COMMENT ON COLUMN doctors.max_patients_per_day IS 'Maximum number of patients doctor can see per day';
COMMENT ON COLUMN doctors.profile_picture_path IS 'Relative path to doctor profile picture';

-- Update version
INSERT INTO schema_version (version, description) VALUES ('1.01', 'Added max_patients_per_day and profile_picture_path columns')
ON CONFLICT DO NOTHING;