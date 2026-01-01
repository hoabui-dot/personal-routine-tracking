-- Add pause support to daily_sessions

-- Add columns for pause tracking
ALTER TABLE daily_sessions 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_paused_seconds INTEGER DEFAULT 0;

-- Update status enum to include PAUSED
-- Note: PostgreSQL doesn't have ALTER TYPE for CHECK constraints, so we'll update the constraint
ALTER TABLE daily_sessions DROP CONSTRAINT IF EXISTS daily_sessions_status_check;
ALTER TABLE daily_sessions ADD CONSTRAINT daily_sessions_status_check 
  CHECK (status IN ('DONE', 'MISSED', 'IN_PROGRESS', 'PAUSED'));

-- Add index for paused sessions
CREATE INDEX IF NOT EXISTS idx_daily_sessions_paused ON daily_sessions(paused_at) WHERE paused_at IS NOT NULL;
