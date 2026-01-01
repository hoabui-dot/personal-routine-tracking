-- Notes table for calendar
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster date queries
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);

-- Unique constraint: one note per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_unique_date ON notes(date);
