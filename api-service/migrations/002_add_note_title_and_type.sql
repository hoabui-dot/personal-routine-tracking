-- Migration: Add title and type to notes table
-- This migration adds title and type fields to support Rich Text and Mind Map notes

-- Add title column (required)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Untitled Note';

-- Add type column (richtext or mindmap)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'richtext';

-- Add check constraint for type
ALTER TABLE notes ADD CONSTRAINT check_note_type 
    CHECK (type IN ('richtext', 'mindmap'));

-- Remove unique constraint on date (allow multiple notes per date)
DROP INDEX IF EXISTS idx_notes_unique_date;

-- Add index for type for faster filtering
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);

-- Add composite index for date and type
CREATE INDEX IF NOT EXISTS idx_notes_date_type ON notes(date, type);
