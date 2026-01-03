# API Proxy GET Request Body Fix

## Issue
Calendar route was returning 500 errors when calling `/api/game/daily-sessions/summary` because the API proxy routes were sending `req.body` for GET requests, causing JSON parsing errors in the backend.

## Root Cause
All API proxy routes were configured to send `req.body` for all HTTP methods, including GET and HEAD requests. Express.js was sending an empty string `""` as the body for GET requests, which caused the backend's body-parser to fail with:

```
SyntaxError: Unexpected token " in JSON at position 0
```

## Solution
Updated all API proxy routes to only send request body for methods that support it (POST, PUT, PATCH, DELETE). GET and HEAD requests no longer send a body.

### Code Pattern Applied
```typescript
const config: any = {
  method: req.method,
  url,
  params: queryParams,
  headers: {
    'Content-Type': req.headers['content-type'] || 'application/json',
    ...(req.headers.authorization && { Authorization: req.headers.authorization }),
  },
  validateStatus: () => true,
};

// Only include body for methods that support it
if (req.method && !['GET', 'HEAD'].includes(req.method)) {
  config.data = req.body;
}

const response = await axios(config);
```

## Files Updated

### API Proxy Routes (10 files)
1. `web-frontend/pages/api/auth/[...path].ts`
2. `web-frontend/pages/api/goals/[...path].ts`
3. `web-frontend/pages/api/sub-goals/[...path].ts`
4. `web-frontend/pages/api/sessions/[...path].ts`
5. `web-frontend/pages/api/notes/[...path].ts`
6. `web-frontend/pages/api/chat/[...path].ts`
7. `web-frontend/pages/api/game/[...path].ts`
8. `web-frontend/pages/api/game/user-goals/[...path].ts`
9. `web-frontend/pages/api/game/daily-sessions/[...path].ts`
10. `web-frontend/pages/api/proxy.ts`

### Already Fixed
- `web-frontend/pages/api/game/users.ts` - Already using proxyHelper

## Testing

### Before Fix
```bash
$ curl http://localhost:3000/api/game/daily-sessions/summary
{"success":false,"error":"Internal server error"}
```

Backend logs showed:
```
Unhandled error: SyntaxError: Unexpected token " in JSON at position 0
```

### After Fix
```bash
$ curl http://localhost:3000/api/game/daily-sessions/summary
{"success":true,"data":[{"user_id":1,"user_name":"Thảo Nhi","total_done":"0","total_missed":"0"},...]}
```

## Verification

### All Services Healthy
```bash
$ docker compose ps
NAME                                   STATUS
personal-routine-tracking-backend-1    Up (healthy)
personal-routine-tracking-frontend-1   Up (healthy)
```

### API Endpoints Working
- ✅ `/api/game/users` - GET request
- ✅ `/api/game/daily-sessions/summary` - GET request
- ✅ All other GET endpoints
- ✅ POST/PUT/DELETE endpoints with body

## Benefits

1. **Correct HTTP Semantics** - GET requests no longer send body
2. **No Backend Errors** - Body parser doesn't fail on empty strings
3. **Better Performance** - Smaller request payloads for GET requests
4. **Standards Compliant** - Follows HTTP specification

## Related Changes

This fix complements the environment validation work:
- All API routes now use validated environment variables
- No hardcoded defaults
- Proper error handling and logging
- Consistent request handling across all routes

## Future Improvements

Consider creating a shared proxy utility function to avoid code duplication across all API routes. The `proxyHelper.ts` file was created but not fully adopted yet.
