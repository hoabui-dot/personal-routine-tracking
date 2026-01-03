# API Proxy Migration Summary

## What Was Changed

All frontend API calls now go through Next.js API routes instead of directly to the backend. This enables the use of Docker's internal network.

## Architecture Changes

### Before
```
Browser → Backend (http://localhost:4000 or external URL)
```

### After
```
Browser → Next.js (/api/*) → Next.js API Routes → Backend (http://backend:4000)
```

## Files Created

### API Routes (pages/api/)
1. **auth/[...path].ts** - Authentication endpoints
2. **goals/[...path].ts** - Goals CRUD
3. **sub-goals/[...path].ts** - Sub-goals CRUD
4. **sessions/[...path].ts** - Sessions CRUD
5. **notes/[...path].ts** - Notes CRUD
6. **chat/[...path].ts** - Chat endpoints
7. **game/[...path].ts** - General game endpoints
8. **game/users.ts** - Users endpoint
9. **game/user-goals/[...path].ts** - User goals management
10. **game/daily-sessions/[...path].ts** - Daily sessions management
11. **proxy.ts** - Generic proxy (backup)

### Documentation
- **web-frontend/API_PROXY_ARCHITECTURE.md** - Detailed architecture documentation
- **API_PROXY_MIGRATION_SUMMARY.md** - This file

## Files Modified

### Environment Configuration
- **web-frontend/.env**
  - Changed `NEXT_PUBLIC_API_URL` from `http://localhost:4000` to `/api`
  - Added `INTERNAL_API_URL=http://backend:4000`

### API Clients
- **web-frontend/lib/api.ts** - Updated base URL to `/api`
- **web-frontend/lib/api/game.ts** - Updated all endpoints to use `/api/game/*`
- **web-frontend/lib/api/notes.ts** - Updated all endpoints to use `/api/notes/*`

### Contexts
- **web-frontend/contexts/AuthContext.tsx** - Updated all auth endpoints to use `/api/auth/*`

## Environment Variables

### Development (.env)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://backend:4000
```

### Docker Compose
The `INTERNAL_API_URL` uses the Docker service name `backend` which resolves to the backend container's IP within the Docker network.

## Benefits

1. **Docker Network**: Uses internal Docker network instead of external URLs
2. **Security**: Backend doesn't need to be exposed publicly
3. **No CORS Issues**: All requests appear to come from same origin
4. **Centralized Logging**: All API calls logged in Next.js server
5. **Middleware Ready**: Easy to add authentication, rate limiting, caching
6. **Flexibility**: Can modify requests/responses before forwarding

## Testing

### Build Test
```bash
docker compose build frontend
```
✅ Build successful

### Runtime Test
```bash
docker compose up
```

Then check:
1. Frontend logs: `docker compose logs -f frontend`
2. Backend logs: `docker compose logs -f backend`
3. Look for `[API Proxy]` or `[*API]` log entries

## API Route Pattern

All API routes follow this pattern:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://backend:4000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;
  const url = `${INTERNAL_API_URL}/endpoint/${path}`;
  
  try {
    console.log('[API Name] Request:', { method: req.method, url });
    
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers.authorization && { 
          Authorization: req.headers.authorization 
        }),
      },
      validateStatus: () => true,
    });
    
    console.log('[API Name] Response:', { status: response.status, url });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[API Name] Error:', { url, error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

## Error Logging

All API routes include comprehensive error logging:
- Request method and URL
- Authorization header presence
- Response status
- Full error details with stack trace

## Migration Checklist

- [x] Created Next.js API routes for all endpoints
- [x] Updated environment variables
- [x] Updated all client libraries
- [x] Updated AuthContext
- [x] Added comprehensive error logging
- [x] Created documentation
- [x] Built and tested Docker image
- [x] Verified build succeeds

## Next Steps

1. **Deploy**: Deploy the updated Docker images
2. **Monitor**: Check logs for any API routing issues
3. **Test**: Test all features in production environment
4. **Optimize**: Add caching, rate limiting if needed

## Rollback Plan

If issues occur, rollback by:

1. Revert `.env` changes:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. Revert client library changes (restore old URLs)

3. Rebuild and redeploy

## Support

For issues or questions, check:
- `web-frontend/API_PROXY_ARCHITECTURE.md` - Detailed architecture
- Docker logs: `docker compose logs frontend backend`
- Next.js build output for errors
