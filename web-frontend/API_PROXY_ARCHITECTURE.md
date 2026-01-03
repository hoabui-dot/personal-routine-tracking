# API Proxy Architecture

## Overview

All API calls from the frontend now go through Next.js API routes instead of directly to the backend. This allows the frontend to use Docker's internal network when running in containers.

## Architecture

```
Browser → Next.js Frontend (/api/*) → Next.js API Routes → Backend (http://backend:4000)
```

## Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=/api              # Public API URL (used by browser)
INTERNAL_API_URL=http://backend:4000  # Internal Docker network URL (used by Next.js server)
```

### Backend (.env)
```env
# No changes needed
```

## API Routes Structure

All API routes are located in `pages/api/` and follow this pattern:

- `/api/auth/[...path]` - Authentication endpoints (login, register, forgot-password, etc.)
- `/api/goals/[...path]` - Goals CRUD operations
- `/api/sub-goals/[...path]` - Sub-goals CRUD operations
- `/api/sessions/[...path]` - Sessions CRUD operations
- `/api/notes/[...path]` - Notes CRUD operations
- `/api/chat/[...path]` - Chat endpoints
- `/api/game/users` - Get all users
- `/api/game/user-goals/[...path]` - User goals management
- `/api/game/daily-sessions/[...path]` - Daily sessions management

## How It Works

1. **Client-side calls**: All client-side code uses `/api/*` endpoints
2. **Next.js API routes**: These routes proxy requests to the backend using `INTERNAL_API_URL`
3. **Backend**: Receives requests from Next.js server via Docker internal network

## Benefits

1. **Docker Network**: Uses internal Docker network (`http://backend:4000`) instead of external URLs
2. **Security**: Backend doesn't need to be exposed publicly
3. **Flexibility**: Easy to add middleware, caching, or rate limiting
4. **CORS**: No CORS issues since all requests appear to come from same origin
5. **Logging**: Centralized logging in Next.js API routes

## Example Request Flow

### Before (Direct to Backend)
```javascript
// Browser makes request directly to backend
fetch('http://localhost:4000/auth/login', { ... })
```

### After (Through Next.js Proxy)
```javascript
// Browser makes request to Next.js API route
fetch('/api/auth/login', { ... })

// Next.js API route proxies to backend
axios.post('http://backend:4000/auth/login', { ... })
```

## Client Libraries

All client libraries have been updated:

- `lib/api.ts` - Main API client (goals, sub-goals, sessions)
- `lib/api/game.ts` - Game API client
- `lib/api/notes.ts` - Notes API client
- `contexts/AuthContext.tsx` - Authentication context

## Development vs Production

### Development (Local)
```env
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://localhost:4000
```

### Production (Docker)
```env
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://backend:4000
```

## Error Handling

All API routes include comprehensive error logging:

```typescript
console.error('[API Route Name] Error:', {
  url,
  error: error instanceof Error ? {
    message: error.message,
    stack: error.stack,
  } : error,
});
```

## Testing

To test the proxy:

1. Start Docker containers: `docker compose up`
2. Check logs: `docker compose logs -f frontend`
3. Look for `[API Proxy]` or `[*API]` log entries
4. Verify requests go through Next.js API routes

## Troubleshooting

### Issue: API calls fail with 404
- Check that API route exists in `pages/api/`
- Verify path matches backend endpoint structure

### Issue: API calls timeout
- Check `INTERNAL_API_URL` is set correctly
- Verify backend container is running: `docker compose ps`
- Check backend logs: `docker compose logs backend`

### Issue: CORS errors
- Should not happen with proxy architecture
- If you see CORS errors, requests might be bypassing the proxy

## Migration Checklist

- [x] Created Next.js API routes for all endpoints
- [x] Updated `NEXT_PUBLIC_API_URL` to `/api`
- [x] Added `INTERNAL_API_URL` for Docker network
- [x] Updated all client libraries to use new URLs
- [x] Updated AuthContext to use new URLs
- [x] Added comprehensive error logging
- [x] Tested in Docker environment
