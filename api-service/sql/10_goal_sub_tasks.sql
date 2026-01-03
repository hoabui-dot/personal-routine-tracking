-- Goal Sub-Tasks Feature Migration
-- This migration adds support for splitting daily goals into smaller sub-tasks

-- Create goal_sub_tasks table
CREATE TABLE IF NOT EXISTS goal_sub_tasks (
    id SERIAL PRIMARY KEY,
    user_goal_id INTEGER NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_goal_id, display_order)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_sub_tasks_user_goal_id ON goal_sub_tasks(user_goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_sub_tasks_display_order ON goal_sub_tasks(display_order);

-- Add sub_task_id column to daily_sessions table (nullable for backward compatibility)
ALTER TABLE daily_sessions 
ADD COLUMN IF NOT EXISTS sub_task_id INTEGER REFERENCES goal_sub_tasks(id) ON DELETE CASCADE;

-- Add index for sub_task_id lookups
CREATE INDEX IF NOT EXISTS idx_daily_sessions_sub_task_id ON daily_sessions(sub_task_id);

-- Add comment to explain the nullable sub_task_id
COMMENT ON COLUMN daily_sessions.sub_task_id IS 'References a specific sub-task. NULL means this session is for the main goal (backward compatibility)';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_goal_sub_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_sub_tasks_updated_at
    BEFORE UPDATE ON goal_sub_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_sub_tasks_updated_at();

-- Verify the schema
DO $$
BEGIN
    -- Check that goal_sub_tasks table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_sub_tasks') THEN
        RAISE EXCEPTION 'goal_sub_tasks table was not created';
    END IF;
    
    -- Check that sub_task_id column exists in daily_sessions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_sessions' AND column_name = 'sub_task_id'
    ) THEN
        RAISE EXCEPTION 'sub_task_id column was not added to daily_sessions';
    END IF;
    
    RAISE NOTICE 'Goal sub-tasks schema migration completed successfully';
END $$;
