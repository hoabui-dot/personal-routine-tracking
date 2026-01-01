-- Remove Test User and all related data
-- This script removes user_id = 5 (Test User) and cascades to all related tables

BEGIN;

-- Delete daily sessions for Test User
DELETE FROM daily_sessions WHERE user_id = 5;

-- Delete user goals for Test User
DELETE FROM user_goals WHERE user_id = 5;

-- Delete user sessions (auth sessions) for Test User
DELETE FROM user_sessions WHERE user_id = 5;

-- Delete the Test User
DELETE FROM users WHERE id = 5;

COMMIT;

-- Verify deletion
SELECT 'Users after deletion:' as info;
SELECT id, name, email FROM users ORDER BY id;

SELECT 'Daily sessions count by user:' as info;
SELECT user_id, COUNT(*) as session_count FROM daily_sessions GROUP BY user_id ORDER BY user_id;

SELECT 'User goals after deletion:' as info;
SELECT user_id, daily_duration_minutes FROM user_goals ORDER BY user_id;
