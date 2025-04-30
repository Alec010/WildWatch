DO $$ 
BEGIN
    -- Check if the column exists before trying to rename it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'witnesses' 
        AND column_name = 'statement'
    ) THEN
        ALTER TABLE witnesses RENAME COLUMN statement TO additional_notes;
    END IF;
END $$; 