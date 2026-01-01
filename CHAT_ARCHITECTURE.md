# Chat Feature Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CALENDAR PAGE                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    GameCalendar                         │    │
│  │  (Main calendar component for goal tracking)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      ChatBox                            │    │
│  │  (Floating chat widget - bottom right)                  │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  Header (Connection Status)                   │     │    │
│  │  ├──────────────────────────────────────────────┤     │    │
│  │  │  Messages Area                                │     │    │
│  │  │  - Message bubbles                            │     │    │
│  │  │  - Timestamps                                 │     │    │
│  │  │  - Typing indicators                          │     │    │
│  │  ├──────────────────────────────────────────────┤     │    │
│  │  │  Input Area                                   │     │    │
│  │  │  [Type message...] [Send]                     │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌──────────────┐         WebSocket          ┌──────────────┐
│   Browser 1  │◄──────────────────────────►│   Browser 2  │
│  (User: Thảo)│         Socket.IO          │ (User: Hoá)  │
└──────┬───────┘                             └──────┬───────┘
       │                                            │
       │ JWT Auth                                   │ JWT Auth
       │ Token                                      │ Token
       │                                            │
       ▼                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│                  (Node.js + Express)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Socket.IO Server                       │    │
│  │  - JWT Authentication Middleware                    │    │
│  │  - Connection Management                            │    │
│  │  - Event Handlers                                   │    │
│  │    • chat:message                                   │    │
│  │    • chat:typing                                    │    │
│  │    • disconnect                                     │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Chat Service                           │    │
│  │  - saveMessage()                                    │    │
│  │  - getRecentMessages()                              │    │
│  │  - getMessagesSince()                               │    │
│  │  - deleteMessage()                                  │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                             │
│               ▼                                             │
└───────────────┼─────────────────────────────────────────────┘
                │
                │ SQL Queries
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              chat_messages Table                    │    │
│  │  - id (PRIMARY KEY)                                 │    │
│  │  - user_id (FK → users.id)                          │    │
│  │  - message (TEXT)                                   │    │
│  │  - created_at (TIMESTAMP)                           │    │
│  │  - updated_at (TIMESTAMP)                           │    │
│  │  - is_deleted (BOOLEAN)                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Message Flow Sequence

### Sending a Message

```
User 1 (Thảo)                ChatBox              Socket.IO           Backend            Database
     │                          │                     │                   │                  │
     │ 1. Types message         │                     │                   │                  │
     ├─────────────────────────►│                     │                   │                  │
     │                          │ 2. Emit typing      │                   │                  │
     │                          ├────────────────────►│                   │                  │
     │                          │                     │ 3. Broadcast      │                  │
     │                          │                     │   typing to       │                  │
     │                          │                     │   other users     │                  │
     │                          │                     ├──────────────────►│                  │
     │                          │                     │                   │                  │
     │ 4. Clicks Send           │                     │                   │                  │
     ├─────────────────────────►│                     │                   │                  │
     │                          │ 5. Emit message     │                   │                  │
     │                          ├────────────────────►│                   │                  │
     │                          │                     │ 6. Broadcast      │                  │
     │                          │                     │   to ALL users    │                  │
     │                          │◄────────────────────┤   (including      │                  │
     │                          │                     │    sender)        │                  │
     │ 7. See message           │                     │                   │                  │
     │   immediately            │                     │                   │                  │
     │◄─────────────────────────┤                     │                   │                  │
     │                          │                     │                   │ 8. Async save    │
     │                          │                     │                   ├─────────────────►│
     │                          │                     │                   │                  │
     │                          │                     │                   │ 9. Saved         │
     │                          │                     │                   │◄─────────────────┤
```

### Receiving a Message (User 2)

```
User 2 (Hoá)                 ChatBox              Socket.IO           Backend
     │                          │                     │                   │
     │                          │ 1. Listen for       │                   │
     │                          │    'chat:message'   │                   │
     │                          │◄────────────────────┤                   │
     │                          │                     │                   │
     │                          │ 2. Update UI        │                   │
     │                          │    with new msg     │                   │
     │ 3. See message           │                     │                   │
     │   in real-time           │                     │                   │
     │◄─────────────────────────┤                     │                   │
     │                          │                     │                   │
     │                          │ 4. Auto-scroll      │                   │
     │                          │    to bottom        │                   │
     │◄─────────────────────────┤                     │                   │
```

## Component Structure

```
ChatBox Component
├── State Management
│   ├── socket (Socket connection)
│   ├── messages (Array of messages)
│   ├── inputMessage (Current input)
│   ├── isConnected (Connection status)
│   ├── typingUsers (Who's typing)
│   └── isMinimized (UI state)
│
├── Effects
│   ├── Initialize socket connection
│   ├── Setup event listeners
│   ├── Auto-scroll on new messages
│   └── Cleanup on unmount
│
├── Event Handlers
│   ├── handleSendMessage()
│   ├── handleInputChange()
│   └── Typing timeout management
│
└── UI Rendering
    ├── Minimized State (Floating button)
    └── Expanded State
        ├── Header (Status + Minimize)
        ├── Messages Area
        │   ├── Message bubbles
        │   ├── Typing indicators
        │   └── Empty state
        └── Input Area
```

## WebSocket Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | `{ auth: { token } }` | Initial connection with JWT |
| `chat:message` | `string` | Send new message |
| `chat:typing` | `boolean` | Update typing status |
| `disconnect` | - | Client disconnected |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Connection established |
| `disconnect` | - | Connection lost |
| `chat:history` | `ChatMessage[]` | Initial message history |
| `chat:message` | `ChatMessage` | New message broadcast |
| `chat:typing` | `{ userId, userName, isTyping }` | Typing status update |
| `chat:error` | `{ message }` | Error notification |

## Database Relationships

```
┌─────────────────┐         ┌──────────────────┐
│     users       │         │  chat_messages   │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────┤ user_id (FK)     │
│ name            │         │ message          │
│ email           │         │ created_at       │
│ ...             │         │ updated_at       │
└─────────────────┘         │ is_deleted       │
                            └──────────────────┘
```

## Performance Considerations

### 1. Lazy Database Updates
```
Message Send → Immediate WebSocket Broadcast (0ms latency)
                    ↓
            Async Database Save (non-blocking)
```

### 2. Message History Limit
- Only load last 50 messages on connect
- Reduces initial load time
- Can implement pagination if needed

### 3. Typing Indicator Optimization
- Auto-timeout after 1 second
- Prevents stale typing indicators
- Reduces unnecessary broadcasts

### 4. Database Indexes
```sql
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_active ON chat_messages(created_at DESC) 
  WHERE is_deleted = FALSE;
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: CORS Protection                                 │
│ - Whitelist allowed origins                              │
│ - Credentials support                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: JWT Authentication                              │
│ - Token validation on connect                            │
│ - User ID extraction                                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Input Validation                                │
│ - Message length checks                                  │
│ - Trim whitespace                                        │
│ - Sanitize input                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Database Constraints                            │
│ - Foreign key constraints                                │
│ - NOT NULL constraints                                   │
│ - Soft delete (no data loss)                             │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Implementation (Single Server)
```
Multiple Clients → Single Socket.IO Server → Single Database
```

### Future Scaling (Redis Adapter)
```
Multiple Clients → Load Balancer
                        ↓
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Server 1        Server 2        Server 3
        └───────────────┼───────────────┘
                        ↓
                  Redis Pub/Sub
                        ↓
                   Database
```

To scale horizontally, add Redis adapter:
```javascript
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(redisClient, redisClient.duplicate()));
```

## Error Handling

```
┌─────────────────────────────────────────────────────────┐
│ Frontend Error Handling                                  │
├─────────────────────────────────────────────────────────┤
│ • Connection errors → Show disconnected status           │
│ • Send failures → Retry or show error message           │
│ • Invalid token → Redirect to login                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Backend Error Handling                                   │
├─────────────────────────────────────────────────────────┤
│ • Auth errors → Reject connection                        │
│ • DB errors → Log but continue (lazy update)             │
│ • Invalid messages → Emit error event                    │
└─────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ Real-time communication
- ✅ Scalable design
- ✅ Fault tolerance
- ✅ Security
- ✅ Performance optimization
