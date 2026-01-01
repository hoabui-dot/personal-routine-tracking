-- Add avatar_url field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);
