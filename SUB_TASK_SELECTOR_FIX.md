# Sub-Task Selector Fix - After Completing First Sub-Task

## Problem
After completing the first sub-task, the UI showed "Resume" and "Stop" buttons but no way to select and start the next sub-task. The user was stuck and couldn't continue with the remaining sub-tasks.

## Root Cause
1. **UI Logic Issue**: The sub-task selector only appeared when `!session && !showTimer`
   - After completing a sub-task, a session still exists (with IN_PROGRESS status)
   - The condition `!session` was false, so selector didn't appear

2. **Timer Display Issue**: `shouldShowTimer()` returned true for any IN_PROGRESS/PAUSED session
   - Even when there was no active sub-task (no `started_at` or `sub_task_id`)
   - UI tried to show timer controls but had nothing to display

3. **Database State**: Session had status 'PAUSED' instead of 'IN_PROGRESS' after completing sub-task

## Solution

### 1. Fixed Database State
```sql
UPDATE daily_sessions 
SET status = 'IN_PROGRESS', started_at = NULL, paused_at = NULL 
WHERE id = 132;
```

### 2. Updated UI Condition for Sub-Task Selector
**Before:**
```typescript
{!session && !showTimer && (
  // Show selector
)}
```

**After:**
```typescript
{(!session || (session && !session.sub_task_id && !session.started_at)) && !showTimer && (
  // Show selector when:
  // 1. No session exists yet, OR
  // 2. Session exists but no active sub-task (completed previous sub-task)
)}
```

### 3. Updated Timer Display Logic
**Before:**
```typescript
const shouldShowTimer = (userId: number, date: string, session?: DailySession) => {
  const status = getCurrentSessionStatus(userId, date, session);
  return status === 'IN_PROGRESS' || status === 'PAUSED';
};
```

**After:**
```typescript
const shouldShowTimer = (userId: number, date: string, session?: DailySession) => {
  const status = getCurrentSessionStatus(userId, date, session);
  // Only show timer if status is IN_PROGRESS or PAUSED AND there's an active sub-task or started_at
  if (status === 'IN_PROGRESS' || status === 'PAUSED') {
    // If session exists, check if there's an active sub-task or timer
    if (session) {
      return !!(session.sub_task_id || session.started_at);
    }
    return true;
  }
  return false;
};
```

### 4. Enhanced Label to Show Progress
Added progress indicator in the selector label:
```typescript
{session && session.duration_completed_minutes > 0 
  ? `✅ Progress: ${session.duration_completed_minutes} min - Select Next Task`
  : 'Select Task to Start'}
```

## User Flow After Fix

### Scenario: 3 Sub-Tasks (60min + 60min + 120min)

1. **Start First Sub-Task**
   - Select "Neurosus" (60 min)
   - Click "▶️ Start Selected Task"
   - Timer starts

2. **Complete First Sub-Task**
   - After 60 minutes, click "✅ Complete Neurosus"
   - Session updated: 60 min progress saved
   - **UI Now Shows:**
     - Label: "✅ Progress: 60 min - Select Next Task"
     - Sub-task dropdown (visible!)
     - "▶️ Start Selected Task" button

3. **Start Second Sub-Task**
   - Select "Learn infra" (60 min) from dropdown
   - Click "▶️ Start Selected Task"
   - Timer starts again

4. **Complete Second Sub-Task**
   - After 60 minutes, click "✅ Complete Learn infra"
   - Session updated: 120 min progress saved
   - **UI Shows:**
     - Label: "✅ Progress: 120 min - Select Next Task"
     - Sub-task dropdown (visible!)
     - Can select third sub-task

5. **Continue Until All Done**
   - Complete all sub-tasks
   - Click "⏹️ Stop" to finish
   - Day marked as DONE ✅

## Technical Details

### Session States
| State | sub_task_id | started_at | status | UI Shows |
|-------|-------------|------------|--------|----------|
| Not started | NULL | NULL | - | Sub-task selector |
| Sub-task active | 152 | timestamp | IN_PROGRESS | Timer + Complete button |
| Sub-task paused | 152 | timestamp | PAUSED | Timer + Resume button |
| Sub-task completed | NULL | NULL | IN_PROGRESS | Sub-task selector (with progress) |
| All done | NULL | NULL | DONE | Checkmark ✅ |

### Key Conditions
```typescript
// Show selector when:
const showSelector = !session || (session && !session.sub_task_id && !session.started_at);

// Show timer when:
const showTimer = (status === 'IN_PROGRESS' || status === 'PAUSED') 
                  && (session.sub_task_id || session.started_at);
```

## Files Modified
- `web-frontend/components/GameCalendar.tsx`
  - Updated sub-task selector condition
  - Updated `shouldShowTimer()` logic
  - Enhanced progress label

## Testing Checklist
- [x] Database state fixed (status = IN_PROGRESS)
- [x] UI logic updated
- [x] Timer display logic fixed
- [ ] Test completing first sub-task
- [ ] Verify selector appears with progress label
- [ ] Test selecting and starting second sub-task
- [ ] Verify timer works for second sub-task
- [ ] Test completing all sub-tasks
- [ ] Verify day marked as DONE

## Current Database State
```
 id  | user_id | goal_id | date       | status      | sub_task_id | started_at | duration_completed_minutes 
-----+---------+---------+------------+-------------+-------------+------------+---------------------------
 132 |       2 |       4 | 2026-01-12 | IN_PROGRESS | NULL        | NULL       | 73
```

User has 73 minutes of progress and can now select the next sub-task!
