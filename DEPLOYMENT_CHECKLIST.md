# Sub-Tasks Feature Deployment Checklist

## Overview
This checklist ensures all components (database, backend, frontend) are synchronized for the sub-tasks feature.

## Pre-Deployment Verification

### 1. Database Schema ✓
- [x] Migration file exists: `api-service/sql/10_goal_sub_tasks.sql`
- [x] Creates `goal_sub_tasks` table
- [x] Adds `sub_task_id` column to `daily_sessions`
- [x] Includes indexes and triggers

### 2. Backend API ✓
- [x] Route handler: `api-service/src/routes/goalSubTasks.ts`
- [x] Registered in `api-service/src/app.ts`
- [x] CRUD operations implemented:
  - GET /goal-sub-tasks (with optional userGoalId filter)
  - POST /goal-sub-tasks (with validation)
  - PUT /goal-sub-tasks/:id (with validation)
  - DELETE /goal-sub-tasks/:id

### 3. Frontend API Proxies ✓
- [x] Main proxy: `web-frontend/pages/api/goal-sub-tasks.ts`
- [x] Individual proxy: `web-frontend/pages/api/goal-sub-tasks/[id].ts`
- [x] API client methods in `web-frontend/lib/api/game.ts`

### 4. Frontend UI ✓
- [x] New settings page: `web-frontend/pages/settings.tsx`
- [x] Old settings backed up: `web-frontend/pages/settings-old.tsx`
- [x] Type definitions: `web-frontend/types/game.ts`
- [x] Features implemented:
  - Grouped goal view
  - Collapsible sections
  - Sub-task CRUD operations
  - Time validation
  - Real-time feedback

## Deployment Steps

### Step 1: Run Database Migration

```bash
# Run the migration script
./run-migration.sh
```

**What it does:**
- Connects to database using credentials from `api-service/.env`
- Runs `10_goal_sub_tasks.sql`
- Creates `goal_sub_tasks` table
- Adds `sub_task_id` column to `daily_sessions`
- Verifies migration success

**Expected Output:**
```
✓ Database connection successful
✓ Migration completed successfully
✓ goal_sub_tasks table exists
✓ sub_task_id column exists in daily_sessions
```

### Step 2: Rebuild Backend

```bash
# Rebuild backend container
docker compose build backend

# Or if you need to force rebuild
docker compose build --no-cache backend
```

**What it does:**
- Compiles TypeScript with new route handler
- Includes `goalSubTasks.ts` in build
- Updates app.ts with new route registration

**Verify:**
```bash
# Check backend logs after restart
docker compose logs backend --tail=50

# Should see:
# "🚀 Personal Tracker API server running on port 4000"
```

### Step 3: Rebuild Frontend

```bash
# Rebuild frontend container
docker compose build frontend

# Or if you need to force rebuild
docker compose build --no-cache frontend
```

**What it does:**
- Compiles new settings page
- Includes sub-task API proxies
- Updates type definitions

**Verify:**
```bash
# Check frontend logs after restart
docker compose logs frontend --tail=50

# Should see:
# "✓ Ready in XXXms"
```

### Step 4: Restart Services

```bash
# Restart all services
docker compose up -d

# Or restart individually
docker compose restart backend
docker compose restart frontend
```

**Verify all services are running:**
```bash
docker compose ps

# All services should show "Up" status
```

### Step 5: Test the Feature

#### 5.1 Test Backend API

```bash
# Test get all sub-tasks (should return empty array initially)
curl http://localhost:4000/goal-sub-tasks

# Expected: {"success":true,"data":[]}
```

#### 5.2 Test Frontend Proxy

```bash
# Test through frontend proxy
curl http://localhost:3000/api/goal-sub-tasks

# Expected: {"success":true,"data":[]}
```

#### 5.3 Test UI

1. Navigate to: `http://localhost:3000/settings` (or your domain)
2. Verify:
   - [ ] Goals are grouped (not showing each user-goal separately)
   - [ ] Can expand/collapse goals
   - [ ] Each user shows under their goal
   - [ ] Can see duration controls
   - [ ] Can click "+ Add Sub-Task"

#### 5.4 Test Sub-Task Creation

1. Click "+ Add Sub-Task" for a user
2. Enter task title (e.g., "Speaking practice")
3. Enter duration (e.g., 60 minutes)
4. Click "Add"
5. Verify:
   - [ ] Sub-task appears in the list
   - [ ] Remaining time updates
   - [ ] Can delete the sub-task

#### 5.5 Test Validation

1. Try to add sub-tasks that exceed goal duration
2. Verify:
   - [ ] Shows "Xmin over limit!" in red
   - [ ] Backend returns 400 error
   - [ ] Cannot save invalid configuration

## Verification Queries

### Check Database Tables

```sql
-- Check if goal_sub_tasks table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goal_sub_tasks'
ORDER BY ordinal_position;

-- Check if sub_task_id column exists in daily_sessions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_sessions' AND column_name = 'sub_task_id';

-- Check existing user goals
SELECT id, user_id, goal_id, daily_duration_minutes 
FROM user_goals;

-- Check sub-tasks (after creating some)
SELECT * FROM goal_sub_tasks;
```

### Check API Endpoints

```bash
# Backend health check
curl http://localhost:4000/health

# Get user goals
curl http://localhost:4000/user-goals

# Get sub-tasks
curl http://localhost:4000/goal-sub-tasks

# Frontend proxy health
curl http://localhost:3000/api/goal-sub-tasks
```

## Rollback Plan

If something goes wrong:

### 1. Rollback Frontend
```bash
# Restore old settings page
mv web-frontend/pages/settings.tsx web-frontend/pages/settings-broken.tsx
mv web-frontend/pages/settings-old.tsx web-frontend/pages/settings.tsx

# Rebuild
docker compose build frontend
docker compose restart frontend
```

### 2. Rollback Backend
```bash
# Remove route registration from app.ts
# Comment out: app.use('/goal-sub-tasks', goalSubTasksRouter);

# Rebuild
docker compose build backend
docker compose restart backend
```

### 3. Rollback Database (if needed)
```sql
-- Drop the sub_task_id column
ALTER TABLE daily_sessions DROP COLUMN IF EXISTS sub_task_id;

-- Drop the goal_sub_tasks table
DROP TABLE IF EXISTS goal_sub_tasks CASCADE;
```

## Common Issues

### Issue 1: Migration fails with "relation already exists"
**Solution:** The migration has already run. Skip to Step 2.

### Issue 2: Backend returns 404 for /goal-sub-tasks
**Cause:** Route not registered or backend not rebuilt
**Solution:** 
```bash
docker compose build --no-cache backend
docker compose restart backend
```

### Issue 3: Frontend shows old settings page
**Cause:** Frontend not rebuilt or browser cache
**Solution:**
```bash
docker compose build --no-cache frontend
docker compose restart frontend
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
```

### Issue 4: "Total sub-tasks duration would exceed goal duration"
**Cause:** Validation working correctly
**Solution:** This is expected behavior. Reduce sub-task durations or increase goal duration.

### Issue 5: Database connection failed
**Cause:** Wrong credentials or database not accessible
**Solution:** Check `api-service/.env` credentials match your database

## Post-Deployment Verification

### Checklist
- [ ] Database migration completed successfully
- [ ] Backend container rebuilt and running
- [ ] Frontend container rebuilt and running
- [ ] Settings page shows grouped goals
- [ ] Can create sub-tasks
- [ ] Can delete sub-tasks
- [ ] Validation prevents over-allocation
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] No errors in frontend logs

### Success Criteria
1. ✅ Settings page groups users by goal
2. ✅ Can add sub-tasks with time estimates
3. ✅ Total sub-task time validated against goal duration
4. ✅ Each user can have different sub-tasks for same goal
5. ✅ UI shows remaining time and validation feedback

## Support

If you encounter issues:

1. **Check logs:**
   ```bash
   docker compose logs backend --tail=100
   docker compose logs frontend --tail=100
   ```

2. **Check database:**
   ```bash
   ./run-migration.sh  # Re-run to verify
   ```

3. **Verify API:**
   ```bash
   curl http://localhost:4000/goal-sub-tasks
   curl http://localhost:3000/api/goal-sub-tasks
   ```

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

## Files Reference

### Database
- `api-service/sql/10_goal_sub_tasks.sql` - Migration file

### Backend
- `api-service/src/routes/goalSubTasks.ts` - Route handler
- `api-service/src/app.ts` - Route registration

### Frontend
- `web-frontend/pages/settings.tsx` - New settings page
- `web-frontend/pages/api/goal-sub-tasks.ts` - API proxy
- `web-frontend/pages/api/goal-sub-tasks/[id].ts` - Individual proxy
- `web-frontend/lib/api/game.ts` - API client methods
- `web-frontend/types/game.ts` - Type definitions

### Scripts
- `run-migration.sh` - Database migration script
- `DEPLOYMENT_CHECKLIST.md` - This file
- `SUB_TASKS_FEATURE_SUMMARY.md` - Feature documentation
