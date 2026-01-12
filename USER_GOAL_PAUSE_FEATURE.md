# User Goal Pause Feature - Implementation Complete

## Overview
Users can now pause their daily goals temporarily to take a break without receiving missed day marks (X) in the calendar. This is useful when users need a short rest but plan to resume later.

## Changes Made

### 1. Database Migration
**File**: `api-service/sql/11_user_goal_pause.sql`
- Added `is_paused` (BOOLEAN, default FALSE) column to `user_goals` table
- Added `paused_at` (TIMESTAMP) column to track when the goal was paused
- Created index on `is_paused` for efficient querying
- Migration executed successfully on production database

### 2. Backend API Updates

#### Routes (`api-service/src/routes/userGoals.ts`)
- Updated GET endpoints to include `is_paused` and `paused_at` fields
- Added `POST /user-goals/:userId/:goalId/pause` - Pause a user goal
- Added `POST /user-goals/:userId/:goalId/unpause` - Resume a user goal

#### Cron Service (`api-service/src/services/cronService.ts`)
- **calculateDailyReports()**: Now only creates MISSED sessions for active (non-paused) goals
  - Query filters: `WHERE ug.is_paused = FALSE OR ug.is_paused IS NULL`
  - Paused goals will NOT receive X marks in the calendar
- **sendDailyReminders()**: Only sends reminders for active goals
  - Users with all goals paused will not receive daily reminder emails

### 3. Frontend Updates

#### Types (`web-frontend/types/game.ts`)
- Added `is_paused?: boolean` to `UserGoal` interface
- Added `paused_at?: string | null` to `UserGoal` interface

#### API Client (`web-frontend/lib/api/game.ts`)
- Added `pauseUserGoal(userId, goalId)` method
- Added `unpauseUserGoal(userId, goalId)` method

#### Settings Page (`web-frontend/pages/settings.tsx`)
- Added pause/resume handlers: `handlePauseGoal()` and `handleUnpauseGoal()`
- Added visual "⏸️ Paused" badge in user goal header when paused
- Added pause/resume button with confirmation dialog
- Shows "Paused since [date]" when goal is paused
- Button styling:
  - Orange/warning gradient when active (to pause)
  - Green/success gradient when paused (to resume)

#### Calendar Page (`web-frontend/components/GameCalendar.tsx`)
- **Filters paused users from calendar grid** - No status icons (✅/❌) shown for paused users
- **Filters paused users from summary stats** - Paused users don't appear in the stats cards
- **Filters paused users from session list** - Paused users cannot start/stop sessions
- All three filter locations check: `!userGoal?.is_paused`

## User Experience

### Pausing a Goal
1. User goes to Settings page
2. Expands their goal
3. Clicks "⏸️ Pause Goal (Take a Break)" button
4. Confirms the action in dialog
5. Goal is marked as paused with timestamp
6. Visual "⏸️ Paused" badge appears
7. **User is immediately hidden from the Calendar page**

### While Paused
- No MISSED sessions are created for past days
- No X marks appear in calendar
- **User is completely hidden from the calendar view**
- **User does not appear in the summary stats**
- **User cannot start/stop sessions (UI is hidden)**
- User does not receive daily reminder emails for paused goals
- Goal shows "Paused since [date]" in settings

### Resuming a Goal
1. User clicks "▶️ Resume Goal" button
2. Goal is immediately reactivated
3. **User reappears in the Calendar page**
4. Tracking continues from today forward
5. Past days while paused remain unmarked (no retroactive MISSED marks)

## Technical Details

### Database Schema
```sql
ALTER TABLE user_goals 
ADD COLUMN is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_user_goals_is_paused ON user_goals(is_paused) WHERE is_paused = TRUE;
```

### API Endpoints
```
POST /game/user-goals/:userId/:goalId/pause
POST /game/user-goals/:userId/:goalId/unpause
```

### Cron Job Logic
The `calculate_daily_reports` cron job (runs daily at midnight) now:
1. Queries only active goals: `WHERE ug.is_paused = FALSE OR ug.is_paused IS NULL`
2. Creates MISSED sessions only for active goals
3. Skips paused goals entirely

## Testing Checklist
- [x] Database migration executed successfully
- [x] Backend API endpoints created
- [x] Frontend UI updated with pause/resume button
- [x] Cron service updated to skip paused goals
- [x] Calendar page filters paused users from display
- [ ] Test pausing a goal in settings
- [ ] Verify user disappears from calendar immediately
- [ ] Verify no MISSED marks appear for paused goals
- [ ] Test resuming a goal
- [ ] Verify user reappears in calendar
- [ ] Verify tracking resumes correctly after unpause
- [ ] Test with multiple users and goals (one paused, one active)

## Example Use Case
**Scenario**: User B in "English Daily Practice" wants to take a 1-week vacation

1. Before vacation: User B pauses their goal in Settings
2. During vacation (7 days): No X marks appear in calendar, no reminder emails
3. After vacation: User B resumes their goal
4. Result: Clean calendar during vacation, tracking resumes seamlessly

## Notes
- Pausing is per user-goal, not per goal (Player A can continue while Player B is paused)
- Past days while paused are NOT retroactively marked as MISSED
- Sub-tasks are not affected by pause status (they follow the parent goal)
- Pause status is preserved across sessions and server restarts
