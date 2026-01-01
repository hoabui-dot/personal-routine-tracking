import { query } from '../db';

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_name?: string;
  avatar_url?: string;
}

class ChatService {
  // Get recent messages (last 50)
  async getRecentMessages(limit: number = 50): Promise<ChatMessage[]> {
    try {
      const result = await query(
        `SELECT cm.*, u.name as user_name, u.avatar_url
         FROM chat_messages cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.is_deleted = FALSE
         ORDER BY cm.created_at DESC
         LIMIT $1`,
        [limit]
      );
      console.log(`📚 Retrieved ${result.rows.length} messages from database`);
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('❌ Error getting recent messages:', error);
      throw error;
    }
  }

  // Save a new message
  async saveMessage(userId: number, message: string): Promise<ChatMessage> {
    try {
      console.log(`💬 Saving message from user ${userId}: "${message.substring(0, 50)}..."`);
      
      const result = await query(
        `INSERT INTO chat_messages (user_id, message)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, message]
      );
      
      // Get user name and avatar
      const userResult = await query('SELECT name, avatar_url FROM users WHERE id = $1', [userId]);
      const userName = userResult.rows[0]?.name;
      const avatarUrl = userResult.rows[0]?.avatar_url;
      
      const savedMessage = {
        ...result.rows[0],
        user_name: userName,
        avatar_url: avatarUrl
      };
      
      console.log(`✅ Message saved successfully with ID: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      console.error('❌ Error saving message:', error);
      throw error;
    }
  }

  // Delete a message (soft delete)
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    const result = await query(
      `UPDATE chat_messages 
       SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [messageId, userId]
    );
    return result.rows.length > 0;
  }

  // Get messages after a specific timestamp (for lazy loading)
  async getMessagesSince(timestamp: string, limit: number = 100): Promise<ChatMessage[]> {
    const result = await query(
      `SELECT cm.*, u.name as user_name, u.avatar_url
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.is_deleted = FALSE AND cm.created_at > $1
       ORDER BY cm.created_at ASC
       LIMIT $2`,
      [timestamp, limit]
    );
    return result.rows;
  }
}

export default new ChatService();
