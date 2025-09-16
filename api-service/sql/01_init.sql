-- Personal Tracker Database Schema

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sub-goals table
CREATE TABLE IF NOT EXISTS sub_goals (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    hours_expected DECIMAL(5,2) NOT NULL CHECK (hours_expected > 0),
    start_month INTEGER NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
    end_month INTEGER NOT NULL CHECK (end_month >= 1 AND end_month <= 12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_month_range CHECK (start_month <= end_month)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    sub_goal_id INTEGER NOT NULL REFERENCES sub_goals(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    hours_spent DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN ended_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (ended_at - started_at)) / 3600.0
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_year ON goals(year);
CREATE INDEX IF NOT EXISTS idx_sub_goals_goal_id ON sub_goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_sessions_sub_goal_id ON sessions(sub_goal_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Insert sample data for testing
INSERT INTO goals (title, year) VALUES 
    ('Learn TypeScript', 2024),
    ('Build Personal Projects', 2024)
ON CONFLICT DO NOTHING;
