-- Add theme preference to users table
-- This migration adds a theme column to store user's preferred theme

-- Add theme column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'capybara-light' 
CHECK (theme IN ('capybara-light', 'capybara-dark', 'christmas'));

-- Add index for theme lookups
CREATE INDEX IF NOT EXISTS idx_users_theme ON users(theme);

-- Add comment to explain the theme column
COMMENT ON COLUMN users.theme IS 'User preferred theme: capybara-light, capybara-dark, or christmas';

-- Verify the schema
DO $$
BEGIN
    -- Check that theme column exists in users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'theme'
    ) THEN
        RAISE EXCEPTION 'theme column was not added to users';
    END IF;
    
    RAISE NOTICE 'User theme preference migration completed successfully';
END $$;
