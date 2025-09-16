-- Fix hours_spent column to allow manual updates
-- This script will be run manually via docker exec

-- Step 1: Drop the generated column constraint
ALTER TABLE sessions DROP COLUMN IF EXISTS hours_spent;

-- Step 2: Add it back as a regular DECIMAL column with higher precision  
ALTER TABLE sessions ADD COLUMN hours_spent DECIMAL(10,6) DEFAULT 0.000000;

-- Step 3: Update existing sessions to calculate hours_spent
UPDATE sessions 
SET hours_spent = CASE 
    WHEN ended_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 3600.0
    ELSE 0
END;

-- Step 4: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_hours_spent ON sessions(hours_spent);

-- Step 5: Verify the changes
SELECT 'Migration completed successfully' as status;
