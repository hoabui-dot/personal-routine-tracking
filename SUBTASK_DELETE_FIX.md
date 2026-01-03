# Sub-Task Delete Error Fix

## Problem
When deleting a sub-task in the settings page, a 500 Internal Server Error occurs.

## Root Cause Analysis

The issue could be caused by:
1. Foreign key constraint violations (though CASCADE should handle this)
2. Missing error details in logs
3. SQL syntax errors in the UPDATE query

## Fix Applied

### 1. Enhanced Error Logging (`api-service/src/routes/goalSubTasks.ts`)

Added detailed logging to the DELETE endpoint:
- Logs the sub-task ID being deleted
- Checks if sub-task exists before deletion
- Counts related sessions that will be cascade deleted
- Logs detailed error information including stack trace
- Returns error details in response for debugging

### 2. Fixed SQL Parameter Bug in UPDATE

The UPDATE query had a bug where parameters weren't properly prefixed with `$`:
```typescript
// ❌ BEFORE (Wrong)
updates.push(`title = ${paramIndex}`);

// ✅ AFTER (Fixed)
updates.push(`title = $${paramIndex}`);
```

This bug could cause issues when updating sub-tasks, which might indirectly affect deletion.

## Testing

### Automated Test Script

Run the test script to debug the deletion:

```bash
./test-delete-subtask.sh
```

This script will:
1. List all sub-tasks
2. Check if any sessions use the first sub-task
3. Attempt to delete it
4. Show detailed error information

### Manual Testing

1. **Restart the backend** to load the new code:
   ```bash
   cd api-service
   npm run dev
   ```

2. **Open settings page**: http://localhost:3000/settings

3. **Try to delete a sub-task**:
   - Click the trash icon next to a sub-task
   - Confirm the deletion
   - Check the browser console for errors
   - Check the backend terminal for `[DELETE]` logs

4. **Check backend logs** for detailed error information:
   - Look for `[DELETE] Attempting to delete sub-task with id: X`
   - Look for `[DELETE] Error details:` if there's an error
   - The error message, stack trace, and details will be logged

## Expected Behavior

### Successful Deletion
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_goal_id": 1,
    "title": "Speaking Practice",
    "duration_minutes": 60,
    "display_order": 0
  },
  "message": "Sub-task deleted successfully (2 related session(s) also removed)"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to delete goal sub-task",
  "details": "specific error message here"
}
```

## Database Cascade Behavior

The foreign key constraint is set to CASCADE:
```sql
ALTER TABLE daily_sessions 
ADD COLUMN IF NOT EXISTS sub_task_id INTEGER 
REFERENCES goal_sub_tasks(id) ON DELETE CASCADE;
```

This means:
- When a sub-task is deleted, all related sessions are automatically deleted
- No manual cleanup needed
- The deletion is atomic (all or nothing)

## Common Issues

### Issue 1: Sub-task in use by active session
**Symptom**: Can't delete sub-task
**Solution**: CASCADE should handle this automatically. If not, check the foreign key constraint.

### Issue 2: Display order conflicts
**Symptom**: Error about unique constraint violation
**Solution**: The UNIQUE constraint is on `(user_goal_id, display_order)`. After deletion, remaining sub-tasks keep their display_order, which is fine.

### Issue 3: Permission denied
**Symptom**: 403 or authentication error
**Solution**: Ensure user is logged in and has permission to modify the goal.

## Files Modified

- ✅ `api-service/src/routes/goalSubTasks.ts` - Enhanced DELETE endpoint with logging
- ✅ `api-service/src/routes/goalSubTasks.ts` - Fixed UPDATE query parameter bug
- ✅ `test-delete-subtask.sh` - Created test script for debugging

## Next Steps

1. Restart the backend server
2. Try deleting a sub-task in the settings page
3. If error persists, check the backend logs for `[DELETE]` messages
4. Run the test script to get detailed information
5. Share the error details from the logs for further debugging

---

**Status**: Enhanced error logging and fixed SQL bug
**Date**: 2026-01-04
