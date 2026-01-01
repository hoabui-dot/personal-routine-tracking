-- Two-Player Daily Goal Game Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the two players
INSERT INTO users (name) VALUES 
    ('Thảo Nhi'),
    ('Văn Hoá')
ON CONFLICT (name) DO NOTHING;

-- Update goals table to include language
ALTER TABLE goals ADD COLUMN IF NOT EXISTS language VARCHAR(50);

-- Add unique constraint to prevent duplicate goals
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_unique ON goals(title, year);

-- User goal settings (daily duration per user)
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    daily_duration_minutes INTEGER NOT NULL CHECK (daily_duration_minutes > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_id)
);

-- Daily sessions for tracking
CREATE TABLE IF NOT EXISTS daily_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_completed_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('DONE', 'MISSED', 'IN_PROGRESS')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_goal_id ON user_goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_id ON daily_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_goal_id ON daily_sessions(goal_id);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions(date);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_status ON daily_sessions(status);

-- Insert English learning goal
INSERT INTO goals (title, year, language) VALUES 
    ('English Daily Practice', 2025, 'English')
ON CONFLICT DO NOTHING
RETURNING id;

-- Set up default daily durations for both users
-- Thảo Nhi: 2 hours (120 minutes)
-- Văn Hoá: 1 hour (60 minutes)
INSERT INTO user_goals (user_id, goal_id, daily_duration_minutes)
SELECT 
    u.id,
    g.id,
    CASE 
        WHEN u.name = 'Thảo Nhi' THEN 120
        WHEN u.name = 'Văn Hoá' THEN 60
    END
FROM users u
CROSS JOIN goals g
WHERE g.title = 'English Daily Practice'
ON CONFLICT (user_id, goal_id) DO NOTHING;
