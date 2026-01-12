-- User Goal Pause Feature Migration
-- This migration adds support for users to pause their daily goals temporarily

-- Add is_paused and paused_at columns to user_goals table
ALTER TABLE user_goals 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the pause feature
COMMENT ON COLUMN user_goals.is_paused IS 'Indicates if the user has temporarily paused this goal. When paused, missed days will not be marked with X in the calendar.';
COMMENT ON COLUMN user_goals.paused_at IS 'Timestamp when the goal was paused. NULL if not currently paused.';

-- Create index for querying paused goals
CREATE INDEX IF NOT EXISTS idx_user_goals_is_paused ON user_goals(is_paused) WHERE is_paused = TRUE;
