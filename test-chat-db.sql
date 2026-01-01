-- Test Chat Database
-- Run this to verify the chat_messages table is working

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages')
        THEN '✅ chat_messages table exists'
        ELSE '❌ chat_messages table does NOT exist'
    END as table_status;

-- Show table structure
\d chat_messages

-- Count existing messages
SELECT COUNT(*) as total_messages FROM chat_messages;

-- Show all users (to get user IDs for testing)
SELECT id, name FROM users;

-- Insert a test message (replace user_id with actual user ID from above)
-- INSERT INTO chat_messages (user_id, message) 
-- VALUES (1, 'Test message from SQL');

-- Show recent messages
SELECT 
    cm.id,
    cm.user_id,
    u.name as user_name,
    cm.message,
    cm.created_at,
    cm.is_deleted
FROM chat_messages cm
JOIN users u ON cm.user_id = u.id
ORDER BY cm.created_at DESC
LIMIT 10;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'chat_messages';
