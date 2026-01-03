# Environment Variable Validation with Zod

## Overview
Implemented comprehensive environment variable validation using Zod for both frontend and backend services. All hardcoded default values have been removed, and environment variables are now validated at runtime before the application starts.

## Changes Made

### Frontend (web-frontend)

#### 1. Created Environment Validation (`lib/env.ts`)
- **Client-side validation**: Validates `NEXT_PUBLIC_API_URL`
- **Server-side validation**: Validates `INTERNAL_API_URL` and `NODE_ENV`
- Throws errors with detailed messages if validation fails
- Exports type-safe environment variables

#### 2. Created API Config Helper (`lib/apiConfig.ts`)
- Provides `getInternalApiUrl()` function for server-side API routes
- Ensures server-side code uses validated environment variables

#### 3. Updated All API Routes
Removed hardcoded defaults from all API proxy routes:
- `pages/api/auth/[...path].ts`
- `pages/api/goals/[...path].ts`
- `pages/api/sub-goals/[...path].ts`
- `pages/api/sessions/[...path].ts`
- `pages/api/notes/[...path].ts`
- `pages/api/chat/[...path].ts`
- `pages/api/game/[...path].ts`
- `pages/api/game/users.ts`
- `pages/api/game/user-goals/[...path].ts`
- `pages/api/game/daily-sessions/[...path].ts`
- `pages/api/proxy.ts`

All now use: `const INTERNAL_API_URL = getInternalApiUrl();`

#### 4. Updated Client-Side API Libraries
- `lib/api.ts`: Uses `clientEnv.NEXT_PUBLIC_API_URL`
- `lib/api/game.ts`: Uses `clientEnv.NEXT_PUBLIC_API_URL`
- `lib/api/notes.ts`: Uses `clientEnv.NEXT_PUBLIC_API_URL`
- `components/ChatBox.tsx`: Uses `clientEnv.NEXT_PUBLIC_API_URL` for Socket.IO connection

### Backend (api-service)

#### 1. Created Environment Validation (`src/env.ts`)
Validates all required environment variables:
- **Server**: `NODE_ENV`, `PORT`
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **JWT**: `JWT_SECRET` (minimum 32 characters)
- **Frontend URLs**: `FRONTEND_URL`, `PUBLIC_FRONTEND_URL`
- **Email**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- **AWS S3**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ENDPOINT`
- **Timezone**: `TZ`

#### 2. Updated All Services
- `src/app.ts`: Uses `env.PORT`, `env.FRONTEND_URL`, `env.NODE_ENV`
- `src/db.ts`: Uses `env.DB_HOST`, `env.DB_PORT`, `env.DB_USER`, `env.DB_PASSWORD`, `env.DB_NAME`
- `src/routes/auth.ts`: Uses `env.JWT_SECRET`
- `src/socket.ts`: Uses `env.JWT_SECRET`, `env.FRONTEND_URL`
- `src/services/emailService.ts`: Uses `env.EMAIL_*`, `env.PUBLIC_FRONTEND_URL`
- `src/services/s3Service.ts`: Uses `env.AWS_*`

### Docker Configuration

#### 1. Updated `docker-compose.yml`
- **Backend**: Removed volume mounts, changed `NODE_ENV` to `production`
- **Frontend**: Removed volume mounts, changed `NODE_ENV` to `production`
- Both services now use built images without local directory overrides

#### 2. Updated Dockerfiles
- **Backend**: Install all dependencies, build, then keep zod in production
- **Frontend**: Simplified single-stage build

## Environment Variables Required

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://backend:4000
NODE_ENV=production
```

### Backend (.env)
```env
NODE_ENV=production
PORT=4000
DB_HOST=db
DB_PORT=5432
DB_USER=superuser
DB_PASSWORD=superuser
DB_NAME=personal_tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
PUBLIC_FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@personaltracker.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=your-bucket
AWS_S3_ENDPOINT=https://s3.amazonaws.com
TZ=Asia/Ho_Chi_Minh
```

## Validation Behavior

### Startup Validation
Both services validate environment variables on startup:
- ✅ **Success**: Logs "Environment variables validated successfully" and continues
- ❌ **Failure**: Logs detailed error messages and exits with error

### Error Messages
Zod provides clear, actionable error messages:
```
❌ Invalid environment variables:
{
  "NEXT_PUBLIC_API_URL": {
    "_errors": ["NEXT_PUBLIC_API_URL is required"]
  }
}
```

## Benefits

1. **Type Safety**: TypeScript knows the exact types of all environment variables
2. **Runtime Validation**: Catches configuration errors before the app starts
3. **No Silent Failures**: No more undefined behavior from missing env vars
4. **Clear Error Messages**: Developers know exactly what's wrong
5. **Documentation**: The schema serves as documentation for required variables
6. **Centralized Configuration**: All env var logic in one place

## Testing

### Build and Start Services
```bash
docker compose build frontend backend
docker compose up -d
```

### Check Logs
```bash
# Should see "✅ Environment variables validated successfully"
docker compose logs backend | grep "Environment"
docker compose logs frontend | grep "Environment"
```

### Verify Services
```bash
docker compose ps
# All services should show "healthy" status
```

## Migration Notes

- **No more default values**: All environment variables must be explicitly set
- **Validation on startup**: Services will fail fast if configuration is invalid
- **Production ready**: Both services now run in production mode in Docker
- **No volume mounts**: Docker containers use built images, not local directories

## Future Improvements

1. Add environment-specific validation (stricter in production)
2. Add validation for URL formats and port ranges
3. Create environment variable templates for different deployment scenarios
4. Add validation for optional vs required variables based on features enabled
