# Real-time Chat Feature Setup Guide

## Overview
This implements a Facebook Messenger-style real-time chat feature with WebSocket for the calendar page, including:
- ✅ Real-time messaging
- ✅ Typing indicators
- ✅ Message history
- ✅ Lazy database updates (non-blocking)
- ✅ Capybara-themed UI
- ✅ Minimizable chat box

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd api-service
npm install socket.io@^4.7.2
npm install --save-dev @types/socket.io@^3.0.2
```

### 2. Install Frontend Dependencies
```bash
cd web-frontend
npm install socket.io-client@^4.7.2
```

### 3. Run Database Migration
```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d personal_tracker -f api-service/sql/08_chat_messages.sql
```

Or manually execute the SQL file content in your database client.

### 4. Restart Services
```bash
# Terminal 1 - Backend
cd api-service
npm run dev

# Terminal 2 - Frontend
cd web-frontend
npm run dev
```

## Features Implemented

### Backend (`api-service/`)
1. **Database Schema** (`sql/08_chat_messages.sql`)
   - `chat_messages` table with user references
   - Indexes for performance
   - Soft delete support
   - Auto-update timestamps

2. **Chat Service** (`src/services/chatService.ts`)
   - Get recent messages
   - Save new messages
   - Delete messages (soft delete)
   - Get messages since timestamp

3. **WebSocket Server** (`src/socket.ts`)
   - JWT authentication
   - Real-time message broadcasting
   - Typing indicators with auto-timeout
   - Connection management
   - Error handling

4. **Updated App** (`src/app.ts`)
   - HTTP server creation
   - Socket.IO initialization
   - CORS configuration

### Frontend (`web-frontend/`)
1. **Chat Component** (`components/ChatBox.tsx`)
   - Real-time message display
   - Typing indicators
   - Message input with auto-typing detection
   - Minimizable floating chat box
   - Auto-scroll to latest message
   - Connection status indicator
   - Capybara-themed design

2. **Calendar Integration** (`pages/calendar.tsx`)
   - Chat box added to calendar page
   - Positioned as floating widget

## How It Works

### Message Flow
1. User types message in chat input
2. Typing indicator emitted to other users via WebSocket
3. User sends message
4. Message immediately broadcast to all connected clients
5. Message saved to database asynchronously (lazy update)
6. If database save fails, message still delivered in real-time

### Typing Indicators
1. User starts typing → emit `chat:typing` with `isTyping: true`
2. Auto-timeout after 1 second of inactivity
3. Other users see "X is typing..." indicator
4. Indicator clears when message sent or timeout reached

### Connection Management
- JWT token authentication on connection
- Auto-reconnect on disconnect
- Connection status displayed in chat header
- Message history loaded on connect

## Database Schema

```sql
chat_messages
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER, FK to users)
├── message (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── is_deleted (BOOLEAN)
```

## WebSocket Events

### Client → Server
- `chat:message` - Send new message
- `chat:typing` - Update typing status

### Server → Client
- `chat:history` - Initial message history
- `chat:message` - New message broadcast
- `chat:typing` - Typing status update
- `chat:error` - Error notification

## Security Features
- JWT authentication required
- Token validation on connection
- User ID verification for all actions
- Soft delete (messages never truly deleted)
- CORS protection

## Performance Optimizations
- Lazy database writes (non-blocking)
- Message history limited to 50 recent messages
- Typing indicator auto-timeout (3 seconds)
- Database indexes on frequently queried columns
- Efficient WebSocket broadcasting

## UI Features
- Minimizable chat box
- Smooth animations
- Auto-scroll to latest message
- Message timestamps
- Own messages vs other messages styling
- Connection status indicator
- Empty state with capybara icon
- Typing animation (bouncing dots)

## Testing

1. Open calendar page in two different browsers
2. Login as different users
3. Send messages from one browser
4. See real-time updates in other browser
5. Test typing indicators
6. Test minimize/maximize
7. Test connection status

## Troubleshooting

### Chat not connecting
- Check if backend is running on correct port
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env`
- Check browser console for WebSocket errors
- Verify JWT token is valid

### Messages not saving to database
- Check database connection
- Verify `chat_messages` table exists
- Check backend console for errors
- Messages still work in real-time even if DB fails

### Typing indicators not working
- Check WebSocket connection
- Verify multiple users are connected
- Check browser console for errors

## Future Enhancements
- Message editing
- Message reactions (emoji)
- File/image sharing
- Read receipts
- Message search
- User online/offline status
- Notification sounds
- Unread message counter
