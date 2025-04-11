-- Drop existing columns if they exist
ALTER TABLE users DROP COLUMN IF EXISTS terms_accepted;
ALTER TABLE users DROP COLUMN IF EXISTS terms_accepted_date;

-- Add terms acceptance columns with proper constraints
ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN terms_accepted_date TIMESTAMP;

-- Update existing records to ensure they have the default value
UPDATE users SET terms_accepted = FALSE WHERE terms_accepted IS NULL;
UPDATE users SET terms_accepted_date = NULL WHERE terms_accepted_date IS NULL;

-- Add a check constraint to ensure terms_accepted is never null
ALTER TABLE users ADD CONSTRAINT terms_accepted_not_null CHECK (terms_accepted IS NOT NULL); 