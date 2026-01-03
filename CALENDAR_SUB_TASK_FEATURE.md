# Calendar Sub-Task Tracking Feature - Complete

## Overview
Successfully implemented goal selector and sub-task tracking in the calendar page, along with scroll position preservation in settings.

## Features Implemented

### 1. Settings Page - Scroll Position Preservation ✅
**File**: `web-frontend/pages/settings.tsx`

**Changes**:
- Modified `loadData()` function to accept `preserveScroll` parameter
- Saves scroll position before data reload
- Restores scroll position after state updates
- All update operations now preserve scroll:
  - `handleUpdateDuration()` - When changing goal duration
  - `handleAddSubTask()` - When adding new sub-tasks
  - `handleDeleteSubTask()` - When deleting sub-tasks

**Result**: Users stay at their current scroll position when making changes or seeing toast notifications.

---

### 2. Calendar Page - Goal Selector ✅
**File**: `web-frontend/components/GameCalendar.tsx`

**Changes**:
- Added `selectedGoalId` state to track which goal is selected
- Added `allSubTasks` state to store all sub-tasks
- Updated `loadData()` to fetch sub-tasks and set default goal
- Added goal selector dropdown UI after month/year header
- Filters displayed users to only show those with the selected goal

**UI Features**:
- Dropdown shows all available goals
- Automatically selects first goal on load
- Users can switch between different goals
- Only shows users who have the selected goal

---

### 3. Calendar Page - Sub-Task Tracking ✅
**File**: `web-frontend/components/GameCalendar.tsx`

**Changes**:
- Added sub-task selection dropdown when starting a session
- Shows sub-tasks specific to each user's goal
- Displays current sub-task name in active session timer
- Passes `subTaskId` to `handleStartSession()`

**UI Features**:
- **Sub-Task Selector**: Dropdown appears before start button if user has sub-tasks
  - Option for "Main Goal (Full Xh)" - tracks entire goal
  - Individual sub-task options with duration (e.g., "Speaking (60min)")
- **Active Session Display**: Shows which sub-task is being tracked
  - Badge with sub-task name and duration
  - Example: "📝 Speaking (60min)"
- **Start Button**: Reads selected sub-task and starts session accordingly

---

### 4. Frontend API Updates ✅
**File**: `web-frontend/lib/api/game.ts`

**Changes**:
```typescript
startSession: async (userId: number, goalId: number, date: string, subTaskId?: number)
```

- Added optional `subTaskId` parameter
- Sends `sub_task_id` in request body to backend

---

### 5. Backend API Updates ✅
**File**: `api-service/src/routes/dailySessions.ts`

**Changes**:
- Updated `POST /daily-sessions/start` endpoint
- Accepts optional `sub_task_id` in request body
- Stores `sub_task_id` when creating/updating session
- Database already has `sub_task_id` column (nullable for backward compatibility)

**SQL**:
```sql
INSERT INTO daily_sessions (user_id, goal_id, date, started_at, status, sub_task_id)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'IN_PROGRESS', $4)
```

---

## Database Schema

The `daily_sessions` table already has the `sub_task_id` column from migration `10_goal_sub_tasks.sql`:

```sql
ALTER TABLE daily_sessions 
ADD COLUMN IF NOT EXISTS sub_task_id INTEGER REFERENCES goal_sub_tasks(id) ON DELETE CASCADE;
```

- **Nullable**: Allows backward compatibility (NULL = tracking main goal)
- **Foreign Key**: References `goal_sub_tasks(id)` with CASCADE delete
- **Indexed**: Has index for performance

---

## User Flow

### Starting a Session with Sub-Task:

1. User navigates to Calendar page
2. Selects a goal from dropdown (e.g., "English Daily Practice")
3. Calendar filters to show only users with that goal
4. User sees their session card with:
   - Avatar and name
   - Goal duration (e.g., "2h per day")
   - Sub-task dropdown (if they have sub-tasks configured)
   - Start button

5. User selects a sub-task from dropdown:
   - "Main Goal (Full 2h)" - tracks entire goal
   - "Speaking (60min)" - tracks only speaking sub-task
   - "Listening (60min)" - tracks only listening sub-task

6. User clicks "▶️ Start Session"
7. Session starts with selected sub-task
8. Timer shows:
   - Sub-task badge: "📝 Speaking (60min)"
   - Countdown timer
   - Progress bar
   - Pause/Stop buttons

### Viewing Active Session:

- Active sessions show which sub-task is being tracked
- Timer counts down based on goal duration (not sub-task duration)
- Sub-task info is displayed for reference
- User can pause/resume/stop as normal

---

## Permission System

The calendar respects user permissions:
- `canUserAct(userId)` checks if logged-in user matches target user
- Only your own sessions can be started/paused/stopped
- Other users' sessions show "🔒 Not your session"
- This prevents users from managing each other's sessions

---

## Testing Checklist

- [x] Settings page preserves scroll position on updates
- [x] Goal selector appears in calendar
- [x] Goal selector filters users correctly
- [x] Sub-task dropdown appears for users with sub-tasks
- [x] Sub-task dropdown shows correct tasks for each user
- [x] Starting session without sub-task works (main goal)
- [x] Starting session with sub-task works
- [x] Active session shows sub-task name
- [x] Backend stores sub_task_id correctly
- [x] Permission system prevents cross-user actions

---

## Files Modified

1. ✅ `web-frontend/pages/settings.tsx` - Scroll preservation
2. ✅ `web-frontend/components/GameCalendar.tsx` - Goal selector + sub-task UI
3. ✅ `web-frontend/lib/api/game.ts` - API method signature
4. ✅ `api-service/src/routes/dailySessions.ts` - Backend endpoint

---

## Next Steps (Optional Enhancements)

1. **Sub-Task Progress Tracking**: Show progress per sub-task vs total goal
2. **Sub-Task History**: Display which sub-tasks were completed on which days
3. **Sub-Task Analytics**: Show time spent per sub-task over time
4. **Sub-Task Validation**: Ensure total sub-task time doesn't exceed goal duration during session
5. **Sub-Task Reordering**: Allow users to change display order of sub-tasks

---

## Notes

- Sub-tasks are optional - users can still track main goal without splitting
- Each user can have different sub-tasks for the same goal
- Sub-task duration is for reference - timer uses goal duration
- Database migration already applied (no new migration needed)
- Backward compatible - existing sessions without sub_task_id still work

