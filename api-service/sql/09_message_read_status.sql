-- Message Read Status Schema
-- Track which messages each user has read

-- Message read receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_read_at ON message_read_receipts(read_at DESC);

-- Composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_message ON message_read_receipts(user_id, message_id);

-- Function to get unread count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM chat_messages cm
    WHERE cm.is_deleted = FALSE
      AND cm.user_id != p_user_id  -- Not sent by this user
      AND NOT EXISTS (
          SELECT 1 
          FROM message_read_receipts mrr 
          WHERE mrr.message_id = cm.id 
            AND mrr.user_id = p_user_id
      );
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_user_id INTEGER, p_message_ids INTEGER[])
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO message_read_receipts (message_id, user_id)
    SELECT unnest(p_message_ids), p_user_id
    ON CONFLICT (message_id, user_id) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;
