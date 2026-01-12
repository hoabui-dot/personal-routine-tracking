-- Completed Sub-Tasks Tracking Migration
-- This migration adds a table to track which sub-tasks have been completed in each session

-- Create completed_subtasks table
CREATE TABLE IF NOT EXISTS completed_subtasks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES daily_sessions(id) ON DELETE CASCADE,
    sub_task_id INTEGER NOT NULL REFERENCES goal_sub_tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER NOT NULL,
    UNIQUE(session_id, sub_task_id)
);

-- Add comment
COMMENT ON TABLE completed_subtasks IS 'Tracks which sub-tasks have been completed within each daily session';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_completed_subtasks_session_id ON completed_subtasks(session_id);
CREATE INDEX IF NOT EXISTS idx_completed_subtasks_sub_task_id ON completed_subtasks(sub_task_id);
