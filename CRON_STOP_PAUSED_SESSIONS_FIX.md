# Stop Paused Sessions Cron Job - Fix for Sub-Tasks

## Problem
The "Stop Paused Sessions" cron job wasn't properly handling sessions with sub-tasks. It only checked if `duration_completed_minutes >= daily_duration_minutes`, which doesn't work correctly when:
1. User completes some sub-tasks but not all
2. Session has 146 minutes completed (2/3 sub-tasks) but goal requires 240 minutes total
3. The job would mark it as MISSED even though user made progress

## Root Cause
The original logic:
```typescript
const isCompleted = session.duration_completed_minutes >= session.target_minutes;
```

This doesn't account for sub-tasks. A session should be marked as DONE only if:
- **With sub-tasks**: ALL sub-tasks are completed
- **Without sub-tasks**: Total duration meets the goal

## Solution
Updated the `stopPausedSessions()` function to:
1. Check if the goal has sub-tasks
2. If yes, count completed sub-tasks vs total sub-tasks
3. If no, use the original duration comparison

### Updated Logic

```typescript
// Check if this goal has sub-tasks
const subTasksResult = await query(`
  SELECT id, duration_minutes FROM goal_sub_tasks 
  WHERE user_goal_id = $1 
  ORDER BY display_order
`, [session.user_goal_id]);

if (subTasksResult.rows.length > 0) {
  // Goal has sub-tasks - check if all are completed
  const completedSubTasksResult = await query(`
    SELECT COUNT(*) as completed_count 
    FROM completed_subtasks 
    WHERE session_id = $1
  `, [session.id]);
  
  const completedCount = parseInt(completedSubTasksResult.rows[0].completed_count);
  const totalSubTasks = subTasksResult.rows.length;
  
  isCompleted = completedCount >= totalSubTasks;
  
  console.log(`[Cron] Session ${session.id}: ${completedCount}/${totalSubTasks} sub-tasks completed`);
} else {
  // No sub-tasks - check total duration
  isCompleted = session.duration_completed_minutes >= session.target_minutes;
  
  console.log(`[Cron] Session ${session.id}: ${session.duration_completed_minutes}/${session.target_minutes} minutes completed`);
}
```

## How It Works Now

### Example: Goal with 3 Sub-Tasks (60min + 60min + 120min = 240min total)

#### Scenario 1: Completed 2/3 Sub-Tasks (146 minutes)
- **Old Logic**: 146 < 240 → MISSED ❌
- **New Logic**: 2 < 3 sub-tasks → MISSED ❌
- **Result**: Correctly marked as MISSED

#### Scenario 2: Completed 3/3 Sub-Tasks (240 minutes)
- **Old Logic**: 240 >= 240 → DONE ✅
- **New Logic**: 3 >= 3 sub-tasks → DONE ✅
- **Result**: Correctly marked as DONE

#### Scenario 3: No Sub-Tasks (120 minutes completed, 120 required)
- **Old Logic**: 120 >= 120 → DONE ✅
- **New Logic**: No sub-tasks, 120 >= 120 → DONE ✅
- **Result**: Correctly marked as DONE

## Cron Job Schedule
```
stop_paused_sessions: 0 0 * * * (Runs at midnight daily)
```

## What the Job Does
1. Finds all sessions from yesterday with status 'PAUSED' or 'IN_PROGRESS'
2. For each session:
   - Checks if goal has sub-tasks
   - Determines completion based on sub-tasks OR duration
   - Updates status to DONE or MISSED
   - Sets finished_at timestamp
   - Clears paused_at

## Database Queries

### Check Session Status
```sql
SELECT 
  ds.id as session_id,
  ds.status,
  ds.duration_completed_minutes,
  ug.id as user_goal_id,
  ug.daily_duration_minutes as target_minutes,
  (SELECT COUNT(*) FROM goal_sub_tasks WHERE user_goal_id = ug.id) as total_subtasks,
  (SELECT COUNT(*) FROM completed_subtasks WHERE session_id = ds.id) as completed_subtasks
FROM daily_sessions ds
JOIN user_goals ug ON ds.user_id = ug.user_id AND ds.goal_id = ug.goal_id
WHERE ds.date = '2026-01-11';
```

### Example Output
```
 session_id | status | duration_completed_minutes | user_goal_id | target_minutes | total_subtasks | completed_subtasks 
------------+--------+----------------------------+--------------+----------------+----------------+--------------------
        134 | MISSED |                          0 |            2 |            240 |              3 |                  0
```

## Testing

### Manual Test
To test the cron job logic without waiting for midnight:

1. Create a test session for yesterday with PAUSED status
2. Complete some sub-tasks (but not all)
3. Run the cron job manually (or wait for midnight)
4. Verify session is marked as MISSED
5. Complete all sub-tasks
6. Run again
7. Verify session is marked as DONE

### Verification Queries

**Check yesterday's sessions:**
```sql
SELECT id, user_id, date, status, duration_completed_minutes 
FROM daily_sessions 
WHERE date = CURRENT_DATE - INTERVAL '1 day';
```

**Check cron job last run:**
```sql
SELECT job_name, last_run, enabled 
FROM cron_config 
WHERE job_name = 'stop_paused_sessions';
```

## Benefits

1. **Accurate Status**: Sessions with partial sub-task completion are correctly marked as MISSED
2. **Fair Tracking**: Users get credit for completing all sub-tasks, not just meeting time
3. **Backward Compatible**: Goals without sub-tasks still work with duration comparison
4. **Better Logging**: Console logs show sub-task completion count

## Files Modified
- `api-service/src/services/cronService.ts` - Updated `stopPausedSessions()` function

## Related Features
- Sub-task completion tracking (`completed_subtasks` table)
- Daily reports calculation
- Calendar status display

## Notes
- Cron job runs at midnight (00:00) daily
- Only processes sessions from yesterday
- Does not affect today's sessions
- Automatically handles both sub-task and non-sub-task goals
- Logs detailed information for debugging
