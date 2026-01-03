# Goal Sub-Tasks Feature

## Overview

Redesigned the settings page to group users by goals and allow each user to break down their daily goal into smaller sub-tasks with time estimates.

## Problem Solved

**Before:**
- Settings showed each user-goal combination separately
- Example: "Văn Hoá - English Daily Practice" and "Thảo Nhi - English Daily Practice" as separate items
- No way to break down goals into smaller tasks

**After:**
- Settings groups by goal (e.g., "English Daily Practice")
- Shows all users under each goal
- Each user can create sub-tasks (e.g., "Speaking: 1h", "Listening: 1h")
- Validates that total sub-task time ≤ goal time

## Features

### 1. Grouped Goal View
- Goals are displayed once with all users underneath
- Collapsible/expandable goal sections
- Clean, organized interface

### 2. Sub-Task Management
- **Add Sub-Tasks**: Break down goals into smaller tasks
- **Time Allocation**: Assign minutes to each sub-task
- **Validation**: Ensures total sub-task time doesn't exceed goal duration
- **Delete Sub-Tasks**: Remove tasks as needed

### 3. Flexible Time Management
- Each user can have different sub-tasks for the same goal
- Example:
  - **Văn Hoá** (2h total): "Speaking: 1h", "Listening: 1h"
  - **Thảo Nhi** (2h total): "Reading: 2h"

### 4. Real-Time Validation
- Shows remaining time available
- Warns if sub-tasks exceed goal duration
- Prevents saving invalid configurations

## Database Schema

### New Table: `goal_sub_tasks`
```sql
CREATE TABLE goal_sub_tasks (
    id SERIAL PRIMARY KEY,
    user_goal_id INTEGER REFERENCES user_goals(id),
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Updated Table: `daily_sessions`
```sql
ALTER TABLE daily_sessions 
ADD COLUMN sub_task_id INTEGER REFERENCES goal_sub_tasks(id);
```

## API Endpoints

### Backend Routes (`/goal-sub-tasks`)

1. **GET /goal-sub-tasks**
   - Get all sub-tasks (optionally filtered by userGoalId)
   - Returns: Array of sub-tasks

2. **POST /goal-sub-tasks**
   - Create a new sub-task
   - Validates total duration doesn't exceed goal
   - Body: `{ user_goal_id, title, duration_minutes }`

3. **PUT /goal-sub-tasks/:id**
   - Update a sub-task
   - Re-validates total duration
   - Body: `{ title?, duration_minutes? }`

4. **DELETE /goal-sub-tasks/:id**
   - Delete a sub-task
   - Returns: Deleted sub-task data

### Frontend API Proxies

- `/api/goal-sub-tasks` - Main endpoint
- `/api/goal-sub-tasks/[id]` - Individual sub-task operations

## UI/UX Design

### Settings Page Layout

```
┌─────────────────────────────────────────┐
│  Daily Goals                            │
├─────────────────────────────────────────┤
│  ▼ English Daily Practice (2 players)  │
│  ├─ Văn Hoá                             │
│  │  ├─ Duration: 2h                     │
│  │  └─ Sub-Tasks:                       │
│  │     ├─ Speaking: 60min               │
│  │     └─ Listening: 60min              │
│  │     [+ Add Sub-Task]                 │
│  │                                       │
│  └─ Thảo Nhi                            │
│     ├─ Duration: 2h                     │
│     └─ Sub-Tasks:                       │
│        └─ Reading: 120min               │
│        [+ Add Sub-Task]                 │
└─────────────────────────────────────────┘
```

### Key UI Elements

1. **Goal Header** (Collapsible)
   - Goal title
   - Number of players
   - Expand/collapse arrow

2. **User Section**
   - User name
   - Total duration control
   - Sub-tasks list
   - Add sub-task button

3. **Sub-Task Item**
   - Task title
   - Duration in minutes
   - Delete button

4. **Add Sub-Task Form**
   - Title input
   - Duration input (minutes)
   - Add/Cancel buttons

5. **Validation Feedback**
   - Shows remaining time
   - Warns if over limit
   - Color-coded (green/red)

## Files Created/Modified

### Backend
- ✅ `api-service/src/routes/goalSubTasks.ts` - New route handler
- ✅ `api-service/src/app.ts` - Registered new route
- ✅ `api-service/sql/10_goal_sub_tasks.sql` - Database schema (already existed)

### Frontend
- ✅ `web-frontend/pages/api/goal-sub-tasks.ts` - API proxy
- ✅ `web-frontend/pages/api/goal-sub-tasks/[id].ts` - Individual sub-task proxy
- ✅ `web-frontend/types/game.ts` - Added `GoalSubTask` interface
- ✅ `web-frontend/lib/api/game.ts` - Added sub-task API methods
- ✅ `web-frontend/pages/settings.tsx` - Completely redesigned
- ✅ `web-frontend/pages/settings-old.tsx` - Backup of old version

## Usage Example

### Scenario: English Daily Practice Goal

**Goal**: English Daily Practice - 2 hours per day

**Văn Hoá's Breakdown:**
- Speaking practice: 60 minutes
- Listening exercises: 60 minutes
- Total: 120 minutes ✅

**Thảo Nhi's Breakdown:**
- Reading comprehension: 120 minutes
- Total: 120 minutes ✅

### Adding a Sub-Task

1. Navigate to Settings page
2. Click on "English Daily Practice" to expand
3. Find your user section
4. Click "+ Add Sub-Task"
5. Enter task title (e.g., "Speaking practice")
6. Enter duration (e.g., 60 minutes)
7. Click "Add"

### Validation

- ✅ If total = 120 minutes: Shows "0min remaining" (green)
- ❌ If total > 120 minutes: Shows "Xmin over limit!" (red) and prevents saving

## Future Enhancements

1. **Session Tracking by Sub-Task**
   - Track which sub-task is being worked on during a session
   - Show progress per sub-task in calendar

2. **Sub-Task Reordering**
   - Drag-and-drop to reorder sub-tasks
   - Suggested order based on priority

3. **Sub-Task Templates**
   - Save common sub-task configurations
   - Quick apply to new goals

4. **Time Recommendations**
   - AI-suggested time allocations
   - Based on historical completion data

5. **Sub-Task Analytics**
   - Which sub-tasks are completed most often
   - Time spent per sub-task type

## Testing

### Manual Testing Checklist

- [ ] Create a sub-task
- [ ] Update sub-task duration
- [ ] Delete a sub-task
- [ ] Try to exceed goal duration (should fail)
- [ ] Collapse/expand goals
- [ ] Multiple users under same goal
- [ ] Save duration changes

### API Testing

```bash
# Get all sub-tasks
curl http://localhost:3000/api/goal-sub-tasks

# Get sub-tasks for specific user goal
curl http://localhost:3000/api/goal-sub-tasks?userGoalId=1

# Create sub-task
curl -X POST http://localhost:3000/api/goal-sub-tasks \
  -H "Content-Type: application/json" \
  -d '{"user_goal_id":1,"title":"Speaking","duration_minutes":60}'

# Update sub-task
curl -X PUT http://localhost:3000/api/goal-sub-tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes":90}'

# Delete sub-task
curl -X DELETE http://localhost:3000/api/goal-sub-tasks/1
```

## Benefits

1. **Better Organization**: Goals grouped logically
2. **Flexibility**: Each user customizes their approach
3. **Clarity**: Clear breakdown of daily tasks
4. **Validation**: Prevents over-allocation of time
5. **User-Friendly**: Intuitive interface with visual feedback

## Notes

- Sub-tasks are optional - users can still use goals without breaking them down
- The `sub_task_id` in `daily_sessions` is nullable for backward compatibility
- Old settings page backed up as `settings-old.tsx`
- Database migration (10_goal_sub_tasks.sql) should run automatically on next deployment
