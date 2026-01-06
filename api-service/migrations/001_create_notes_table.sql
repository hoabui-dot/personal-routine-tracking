-- Migration: Create notes table
-- This migration creates the notes table for storing calendar notes

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

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();
