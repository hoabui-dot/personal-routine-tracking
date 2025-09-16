-- Fix hours_spent column to allow manual updates
-- Drop the generated column constraint and make it a regular DECIMAL column

-- First, drop the generated column
ALTER TABLE sessions DROP COLUMN IF EXISTS hours_spent;

-- Add it back as a regular DECIMAL column with higher precision
ALTER TABLE sessions ADD COLUMN hours_spent DECIMAL(10,4) DEFAULT 0.00;

-- Update existing sessions to calculate hours_spent
UPDATE sessions 
SET hours_spent = CASE 
    WHEN ended_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 3600.0
    ELSE 0
END
WHERE hours_spent = 0 OR hours_spent IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_hours_spent ON sessions(hours_spent);
