-- Update incident_updates.message column to support up to 500 characters
ALTER TABLE incident_updates ALTER COLUMN message TYPE VARCHAR(500);

-- Update activity_logs.description column to support up to 1000 characters
ALTER TABLE activity_logs ALTER COLUMN description TYPE VARCHAR(1000);

