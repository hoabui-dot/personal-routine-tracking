# 🔧 Chat Feature Troubleshooting Guide

## Issue: Messages Lost on Refresh

### Root Cause
Messages were not being saved to the database properly because:
1. The original code used "lazy update" with `.catch()` which didn't wait for DB save
2. Temporary IDs were used instead of real database IDs
3. Messages were broadcast before being saved

### Fix Applied
✅ Changed to `await` the database save before broadcasting  
✅ Use real database IDs from saved messages  
✅ Added comprehensive logging for debugging  

## Verification Steps

### Step 1: Check Database Table Exists
```bash
./check-chat-db.sh
```

This will:
- Check if `chat_messages` table exists
- Show table structure
- Display message count
- Show recent messages
- List indexes

### Step 2: Run Database Migration (if needed)
```bash
# Get your database credentials from api-service/.env
psql -h localhost -p 5432 -U your_username -d personal_tracker -f api-service/sql/08_chat_messages.sql
```

### Step 3: Test Database Manually
```bash
psql -h localhost -p 5432 -U your_username -d personal_tracker -f test-chat-db.sql
```

### Step 4: Check Backend Logs
When you send a message, you should see:
```
💬 Saving message from user 1: "Hello world..."
✅ Message saved successfully with ID: 123
💾 Message saved to DB with ID: 123
```

When you connect, you should see:
```
✅ User 1 connected to chat
📚 Retrieved 5 messages from database
📨 Sending 5 messages to user 1
```

### Step 5: Test the Fix
1. **Restart backend server**:
   ```bash
   cd api-service
   npm run dev
   ```

2. **Open calendar page**: http://localhost:3000/calendar

3. **Send a test message**: Type and send "Test message 1"

4. **Check backend console**: Should see save confirmation

5. **Refresh the page**: Message should still be there

6. **Open in another browser**: Should see the same message

## Common Issues & Solutions

### Issue 1: Table Doesn't Exist
**Symptoms**: Error in backend logs about `chat_messages` table not found

**Solution**:
```bash
psql -U your_username -d personal_tracker -f api-service/sql/08_chat_messages.sql
```

### Issue 2: User ID Not Found
**Symptoms**: Error about foreign key constraint

**Solution**: Make sure users exist in the database
```sql
SELECT id, name FROM users;
```

If no users, run the user creation migration:
```bash
psql -U your_username -d personal_tracker -f api-service/sql/05_two_player_game.sql
```

### Issue 3: Connection Refused
**Symptoms**: Chat shows "Disconnected" status

**Solutions**:
- Check backend is running on port 4000
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env`
- Check CORS settings in `api-service/src/app.ts`
- Verify JWT token is valid

### Issue 4: Messages Not Appearing
**Symptoms**: Send message but nothing shows up

**Debug Steps**:
1. Open browser console (F12)
2. Check for WebSocket errors
3. Check Network tab for WebSocket connection
4. Look for `chat:message` events
5. Check backend console for errors

**Common Causes**:
- Database connection failed
- User not authenticated
- WebSocket not connected
- Message validation failed

### Issue 5: Old Messages Not Loading
**Symptoms**: New messages work but history doesn't load

**Debug Steps**:
1. Check backend logs for "Retrieved X messages"
2. Verify messages exist in database:
   ```sql
   SELECT COUNT(*) FROM chat_messages WHERE is_deleted = FALSE;
   ```
3. Check if `chat:history` event is being emitted
4. Check frontend console for received history

### Issue 6: TypeScript Errors
**Symptoms**: Build fails with type errors

**Solution**:
```bash
# Backend
cd api-service
npm install socket.io@^4.7.2 @types/socket.io@^3.0.2

# Frontend
cd web-frontend
npm install socket.io-client@^4.7.2
```

## Debug Commands

### Check Database Connection
```bash
psql -U your_username -d personal_tracker -c "SELECT version();"
```

### Count Messages
```bash
psql -U your_username -d personal_tracker -c "SELECT COUNT(*) FROM chat_messages;"
```

### View Recent Messages
```bash
psql -U your_username -d personal_tracker -c "
  SELECT cm.id, u.name, cm.message, cm.created_at 
  FROM chat_messages cm 
  JOIN users u ON cm.user_id = u.id 
  ORDER BY cm.created_at DESC 
  LIMIT 10;
"
```

### Clear All Messages (for testing)
```bash
psql -U your_username -d personal_tracker -c "DELETE FROM chat_messages;"
```

### Insert Test Message
```bash
psql -U your_username -d personal_tracker -c "
  INSERT INTO chat_messages (user_id, message) 
  VALUES (1, 'Test message from SQL');
"
```

## Backend Logging

The updated code includes comprehensive logging:

### Connection Logs
```
✅ User 1 connected to chat
📚 Retrieved 5 messages from database
📨 Sending 5 messages to user 1
```

### Message Logs
```
💬 Saving message from user 1: "Hello world..."
✅ Message saved successfully with ID: 123
💾 Message saved to DB with ID: 123
```

### Error Logs
```
❌ Error saving message: [error details]
❌ Error getting recent messages: [error details]
```

## Frontend Debugging

### Open Browser Console
Press F12 and check:

1. **WebSocket Connection**:
   ```
   ✅ Connected to chat
   ```

2. **Received History**:
   ```javascript
   // Should see chat:history event with array of messages
   ```

3. **New Messages**:
   ```javascript
   // Should see chat:message events
   ```

### Check Network Tab
1. Look for WebSocket connection to `ws://localhost:4000`
2. Should show "101 Switching Protocols"
3. Check WS tab for messages

## Performance Checks

### Database Query Performance
```sql
EXPLAIN ANALYZE 
SELECT cm.*, u.name as user_name 
FROM chat_messages cm
JOIN users u ON cm.user_id = u.id
WHERE cm.is_deleted = FALSE
ORDER BY cm.created_at DESC
LIMIT 50;
```

Should use indexes efficiently.

### Check Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'chat_messages';
```

Should see:
- `idx_chat_messages_user_id`
- `idx_chat_messages_created_at`
- `idx_chat_messages_is_deleted`
- `idx_chat_messages_active`

## Still Having Issues?

### 1. Check All Services Running
```bash
# Backend
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000
```

### 2. Check Environment Variables
```bash
# Backend .env
cat api-service/.env | grep -E "DB_|JWT_"

# Frontend .env
cat web-frontend/.env | grep API_URL
```

### 3. Restart Everything
```bash
# Stop all services (Ctrl+C)

# Clear node_modules if needed
cd api-service && rm -rf node_modules && npm install
cd ../web-frontend && rm -rf node_modules && npm install

# Restart
cd api-service && npm run dev
# In another terminal:
cd web-frontend && npm run dev
```

### 4. Check Database Logs
```bash
# On macOS with Homebrew PostgreSQL
tail -f /usr/local/var/log/postgres.log

# On Linux
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Success Indicators

✅ Backend shows: "✅ Socket.IO initialized for real-time chat"  
✅ Frontend shows: "🟢 Connected" in chat header  
✅ Messages persist after page refresh  
✅ Messages appear in database  
✅ Multiple users can see each other's messages  
✅ Typing indicators work  
✅ No errors in console  

## Contact

If issues persist after following this guide:
1. Check backend console for error messages
2. Check browser console for errors
3. Verify database migration ran successfully
4. Review the code changes in `api-service/src/socket.ts`

---

**Updated**: Fixed lazy database updates to properly save messages before broadcasting
