# WebSocket/Socket.IO Configuration Fix

## Date: January 3, 2026

## Problem
The frontend was trying to connect to Socket.IO at `http://localhost:3000/socket.io`, but Socket.IO server is running on the backend at port 4000. The error was:
```
http://localhost:3000/socket.io?EIO=4&transport=polling&t=adrponpq 404 (Not Found)
```

## Solution
Implemented a server-side configuration approach where the Socket.IO URL is provided through an internal API endpoint, allowing the frontend to connect to the backend using the internal Docker network.

## Architecture

### Before (Incorrect)
```
Browser → http://localhost:3000/socket.io (404 - doesn't exist)
```

### After (Correct)
```
Browser → Fetch /api/socket-config → Get internal URL → Connect to http://backend:4000
```

## Changes Made

### 1. Environment Configuration

**Added `INTERNAL_SOCKET_URL` to server-side environment:**

`web-frontend/lib/env.ts`:
- Added `INTERNAL_SOCKET_URL` to `serverEnvSchema`
- This is a server-only variable (not exposed to browser)

`web-frontend/.env`:
```env
INTERNAL_SOCKET_URL=http://backend:4000
```

`docker-compose.yml`:
```yaml
environment:
  INTERNAL_SOCKET_URL: http://backend:4000
```

### 2. Socket Configuration API

**Created `/api/socket-config` endpoint:**

`web-frontend/pages/api/socket-config.ts`:
- Server-side API route that returns the internal Socket.IO URL
- Only accessible from the Next.js server
- Returns: `{ success: true, socketUrl: "http://backend:4000" }`

### 3. ChatBox Component Update

**Modified `web-frontend/components/ChatBox.tsx`:**

Before:
```typescript
const API_URL = clientEnv.NEXT_PUBLIC_API_URL;
const newSocket = io(API_URL, { auth: { token } });
```

After:
```typescript
const initSocket = async () => {
  const response = await fetch('/api/socket-config');
  const data = await response.json();
  const SOCKET_URL = data.socketUrl;
  const newSocket = io(SOCKET_URL, { auth: { token } });
  // ... rest of socket setup
};
initSocket();
```

## Benefits

1. **Internal Network Communication**: Socket.IO connects through Docker's internal network (`backend:4000`) instead of exposing the backend port publicly
2. **Security**: Backend URL is not exposed to the browser
3. **Flexibility**: Can easily change the Socket.IO URL without rebuilding the frontend
4. **Consistency**: Follows the same pattern as other API endpoints (`/api/*`)

## Testing

Test the socket configuration endpoint:
```bash
curl http://localhost:3000/api/socket-config
```

Expected response:
```json
{
  "success": true,
  "socketUrl": "http://backend:4000"
}
```

## Files Modified

1. `web-frontend/lib/env.ts` - Added INTERNAL_SOCKET_URL to server schema
2. `web-frontend/pages/api/socket-config.ts` - New API endpoint
3. `web-frontend/components/ChatBox.tsx` - Updated socket initialization
4. `web-frontend/.env` - Added INTERNAL_SOCKET_URL
5. `docker-compose.yml` - Added INTERNAL_SOCKET_URL environment variable
6. `.env.example` - Removed NEXT_PUBLIC_SOCKET_URL (no longer needed)

## Notes

- The Socket.IO connection now uses the internal Docker network
- The browser fetches the Socket.IO URL from the server at runtime
- This approach works for both development and production environments
- No need to expose the backend port publicly for WebSocket connections
