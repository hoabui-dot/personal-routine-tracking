# HTTP Cookie Fix - Session Persistence Issue

## Problem
Users were getting logged out on every page refresh when using HTTP (not HTTPS). The session cookies were not being stored or reused by the browser.

## Root Cause
1. **NODE_ENV was set to 'production'** in `.env` file
2. Cookie configuration used `secure: env.NODE_ENV === 'production'`
3. When `secure: true`, cookies are only sent over HTTPS
4. Since the app was running on HTTP, cookies were rejected by the browser

## Solution

### 1. Changed NODE_ENV to Development
**File**: `api-service/.env`

```diff
- NODE_ENV=production
+ NODE_ENV=development
```

This allows the app to run in development mode where cookies work with HTTP.

### 2. Updated Cookie Configuration
**File**: `api-service/src/routes/auth.ts`

Changed cookie settings to explicitly allow HTTP:

```typescript
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: false, // Allow HTTP for development/local testing
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  domain: undefined, // Don't set domain to allow localhost
});
```

**Key Changes:**
- `secure: false` - Allows cookies over HTTP
- `domain: undefined` - Works with localhost and any domain
- `sameSite: 'lax'` - Allows cookies in cross-site requests (needed for API proxy)

### 3. Updated Logout Cookie Clearing
Also updated the logout endpoint to use the same cookie options:

```typescript
res.clearCookie('auth_token', {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
  domain: undefined,
});
```

## How It Works

### Cookie Flow
1. **Login**: User logs in → Backend sets `auth_token` cookie → Browser stores it
2. **API Requests**: Browser automatically sends cookie with each request
3. **Authentication**: Backend reads cookie, verifies JWT, returns user data
4. **Refresh**: Page refreshes → Cookie is sent → User stays logged in ✅

### Frontend Proxy
The frontend uses Next.js API routes as a proxy:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Proxy: `/api/auth/*` → `http://localhost:4000/auth/*`

The proxy forwards cookies in both directions:
```typescript
// Forward cookies from client to backend
headers: {
  ...(req.headers.cookie && { Cookie: req.headers.cookie }),
}

// Forward Set-Cookie from backend to client
if (response.headers['set-cookie']) {
  res.setHeader('Set-Cookie', response.headers['set-cookie']);
}
```

## Testing

### Verify Cookie is Set
1. Open browser DevTools → Application/Storage → Cookies
2. Login to the app
3. Check for `auth_token` cookie with:
   - **HttpOnly**: ✓ (prevents JavaScript access)
   - **Secure**: ✗ (allows HTTP)
   - **SameSite**: Lax
   - **Path**: /
   - **Expires**: 7 days from now

### Verify Session Persistence
1. Login to the app
2. Refresh the page (F5 or Ctrl+R)
3. ✅ Should stay logged in
4. Close and reopen browser
5. ✅ Should still be logged in (within 7 days)

### Verify Logout
1. Click logout button
2. Check cookies → `auth_token` should be removed
3. Refresh page → Should redirect to login

## Configuration Files

### Backend (.env)
```properties
NODE_ENV=development  # Changed from production
DB_HOST=13.210.111.152
DB_PORT=5432
DB_USER=superuser
DB_PASSWORD=superuser
DB_NAME=personal_tracker
PORT=4000
TZ=Asia/Ho_Chi_Minh
FRONTEND_URL=http://localhost:3000
PUBLIC_FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend (.env)
```properties
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://localhost:4000
INTERNAL_SOCKET_URL=http://localhost:4000
```

### CORS Configuration
**File**: `api-service/src/app.ts`

```typescript
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3001'],
    credentials: true, // Important for cookies
  })
);
```

## Security Notes

### Development vs Production

**Development (HTTP):**
- `secure: false` - Cookies work over HTTP
- `NODE_ENV: development`
- Suitable for localhost testing

**Production (HTTPS):**
- `secure: true` - Cookies only over HTTPS
- `NODE_ENV: production`
- Required for deployed apps

### For Production Deployment
When deploying to production with HTTPS, update:

1. **Backend .env:**
```properties
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

2. **Cookie Configuration:**
```typescript
secure: env.NODE_ENV === 'production', // Will be true
```

This will automatically enable secure cookies for HTTPS.

## Troubleshooting

### Still Getting Logged Out?

1. **Check Browser Console**
   - Look for CORS errors
   - Check if cookies are being set

2. **Check Network Tab**
   - Login request should have `Set-Cookie` in response headers
   - Subsequent requests should have `Cookie` in request headers

3. **Check Backend Logs**
   - Should see: `[Auth /login] Cookie set successfully`
   - Should see: `[Auth /me] Token decoded successfully`

4. **Clear Browser Data**
   - Clear all cookies and cache
   - Try logging in again

5. **Check Cookie Settings**
   - Browser might block third-party cookies
   - Check browser privacy settings

### Common Issues

**Issue**: Cookie not visible in DevTools
- **Cause**: HttpOnly flag prevents JavaScript access
- **Solution**: This is normal and secure. Check Network tab instead.

**Issue**: Cookie not sent with requests
- **Cause**: Domain mismatch or SameSite restriction
- **Solution**: Ensure `domain: undefined` and `sameSite: 'lax'`

**Issue**: CORS error
- **Cause**: Frontend URL not in CORS whitelist
- **Solution**: Add your frontend URL to `cors.origin` array

## Files Modified
- `api-service/.env` - Changed NODE_ENV to development
- `api-service/src/routes/auth.ts` - Updated cookie configuration

## Related Files (Already Correct)
- `api-service/src/app.ts` - CORS configuration
- `web-frontend/pages/api/auth/[...path].ts` - Cookie forwarding proxy
- `web-frontend/.env` - API URL configuration
