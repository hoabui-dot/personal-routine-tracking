# 🚀 Quick Start - Real-time Chat Feature

## Installation (3 Steps)

### Step 1: Install Dependencies
```bash
./install-chat.sh
```

Or manually:
```bash
# Backend
cd api-service
npm install socket.io@^4.7.2 @types/socket.io@^3.0.2

# Frontend
cd ../web-frontend
npm install socket.io-client@^4.7.2
```

### Step 2: Database Migration
```bash
psql -U your_username -d personal_tracker -f api-service/sql/08_chat_messages.sql
```

### Step 3: Start Services
```bash
# Terminal 1 - Backend
cd api-service && npm run dev

# Terminal 2 - Frontend
cd web-frontend && npm run dev
```

## Test It

1. Open http://localhost:3000/calendar
2. Login as first user
3. Open incognito/another browser
4. Login as second user
5. Start chatting! 🦫

## What You Get

✅ Real-time messaging  
✅ Typing indicators  
✅ Message history  
✅ Minimizable chat box  
✅ Connection status  
✅ Capybara-themed UI  

## Files Created

**Backend:**
- `api-service/sql/08_chat_messages.sql` - Database schema
- `api-service/src/services/chatService.ts` - Chat service
- `api-service/src/socket.ts` - WebSocket server

**Frontend:**
- `web-frontend/components/ChatBox.tsx` - Chat component

**Modified:**
- `api-service/src/app.ts` - Added Socket.IO
- `web-frontend/pages/calendar.tsx` - Added chat
- Both `package.json` files - Added dependencies

## Documentation

📖 **Detailed Setup**: `CHAT_SETUP.md`  
📊 **Architecture**: `CHAT_ARCHITECTURE.md`  
📝 **Summary**: `CHAT_FEATURE_SUMMARY.md`  

## Troubleshooting

**Not connecting?**
- Check backend is running on port 4000
- Verify JWT token is valid
- Check browser console for errors

**Messages not saving?**
- Verify database migration ran
- Check backend console for errors
- Note: Real-time still works even if DB fails

## Need Help?

Check the detailed documentation files or review the inline code comments.

---

**Built for Capybara Tracker 🦫**
