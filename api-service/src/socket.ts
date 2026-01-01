import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import chatService from './services/chatService';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-this';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
}

// Store typing status
const typingUsers = new Map<number, NodeJS.Timeout>();

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env['FRONTEND_URL'] || 'http://localhost:3000',
        'http://localhost:3001'
      ],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth['token'];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      socket.userId = decoded.userId;
      
      // Get user name from database (we'll fetch it on connection)
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`✅ User ${socket.userId} connected to chat`);

    // Fetch user name and avatar
    try {
      const { query } = await import('./db');
      const result = await query('SELECT name, avatar_url FROM users WHERE id = $1', [socket.userId]);
      socket.userName = result.rows[0]?.name || 'Unknown';
      (socket as any).userAvatar = result.rows[0]?.avatar_url || null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      socket.userName = 'Unknown';
      (socket as any).userAvatar = null;
    }

    // Send recent messages to newly connected user
    try {
      const recentMessages = await chatService.getRecentMessages(50);
      console.log(`📨 Sending ${recentMessages.length} messages to user ${socket.userId}`);
      socket.emit('chat:history', recentMessages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }

    // Handle new message
    socket.on('chat:message', async (message: string) => {
      if (!socket.userId || !message || message.trim().length === 0) {
        return;
      }

      try {
        // Save to database and get the saved message with real ID
        const savedMessage = await chatService.saveMessage(socket.userId, message.trim());
        console.log(`💾 Message saved to DB with ID: ${savedMessage.id}`);

        // Broadcast the saved message to all clients (including sender)
        io.emit('chat:message', savedMessage);

        // Clear typing indicator for this user
        if (typingUsers.has(socket.userId)) {
          clearTimeout(typingUsers.get(socket.userId)!);
          typingUsers.delete(socket.userId);
        }
        
        io.emit('chat:typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping: false
        });
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', (isTyping: boolean) => {
      if (!socket.userId) return;

      console.log(`📝 User ${socket.userId} (${socket.userName}) typing: ${isTyping}`);

      // Clear existing timeout
      if (typingUsers.has(socket.userId)) {
        clearTimeout(typingUsers.get(socket.userId)!);
      }

      if (isTyping) {
        // Set timeout to auto-clear typing after 3 seconds
        const timeout = setTimeout(() => {
          typingUsers.delete(socket.userId!);
          io.emit('chat:typing', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });
          console.log(`⏰ Auto-cleared typing for user ${socket.userId}`);
        }, 3000);

        typingUsers.set(socket.userId, timeout);
      } else {
        typingUsers.delete(socket.userId);
      }

      // Broadcast typing status to all other users
      const typingData = {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      };
      
      console.log(`📤 Broadcasting typing event:`, typingData);
      socket.broadcast.emit('chat:typing', typingData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected from chat`);
      
      // Clear typing indicator
      if (socket.userId && typingUsers.has(socket.userId)) {
        clearTimeout(typingUsers.get(socket.userId)!);
        typingUsers.delete(socket.userId);
        
        io.emit('chat:typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping: false
        });
      }
    });
  });

  console.log('✅ Socket.IO initialized for real-time chat');
  return io;
};
