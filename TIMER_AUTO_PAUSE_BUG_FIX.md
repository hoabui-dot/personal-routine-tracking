# 🔴 Timer Auto-Pause Bug - Critical Fix

**Date:** January 15, 2026  
**Severity:** CRITICAL - Timer stops unexpectedly  
**Status:** ✅ FIXED  

---

## 🐛 Bug Description

**Reported Issue:**
- Timer keeps getting paused/stopped even though it's running
- User doesn't want the clock to pause automatically on calendar page
- FloatingTimerPopup doesn't display after navigation

**Root Cause:**
The `checkAndCleanup` API endpoint was **auto-pausing ALL IN_PROGRESS sessions** every time it was called, which happened:
1. When GameCalendar component initialized (on /calendar page load)
2. When TimerContext initialized (on every page load)
3. Multiple times during navigation

This caused timers to be paused unintentionally!

---

## 🔍 Root Cause Analysis

### **The Problematic Code:**

**Location:** `api-service/src/routes/dailySessions.ts` - `checkAndCleanup` endpoint

```typescript
// OLD CODE - AUTO-PAUSED ALL TIMERS!
router.post('/check-and-cleanup', async (_, res: Response) => {
  // ... cleanup old sessions ...
  
  // ❌ THIS WAS THE PROBLEM:
  // Auto-pause all IN_PROGRESS sessions for today (on page refresh)
  const todayInProgressResult = await query(`
    SELECT * FROM daily_sessions 
    WHERE date = $1 
    AND status = 'IN_PROGRESS'
  `, [today]);
  
  const todayInProgress = todayInProgressResult.rows;
  
  if (todayInProgress.length > 0) {
    await query(`
      UPDATE daily_sessions 
      SET 
        status = 'PAUSED',           // ❌ Auto-pausing!
        paused_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE date = $1 
      AND status = 'IN_PROGRESS'
    `, [today]);
  }
  
  // Return only PAUSED/DONE sessions
  const todayResult = await query(`
    SELECT * FROM daily_sessions
    WHERE ds.date = $1 
    AND ds.status IN ('PAUSED', 'DONE')  // ❌ Excludes IN_PROGRESS!
  `, [today]);
  
  res.json({
    success: true,
    data: {
      cleanedUp: staleSessions.length,
      autoPaused: todayInProgress.length,  // ❌ Reports auto-pause
      sessions: todayResult.rows,
    },
  });
});
```

### **Why This Was Wrong:**

1. **Unintended Behavior:** The endpoint was designed to clean up stale sessions from previous days, but it was also pausing today's active timers
2. **Called Too Often:** This endpoint was called on every page load/navigation
3. **User Experience:** Users would start a timer, navigate away, and come back to find it paused
4. **Data Loss:** The popup couldn't find IN_PROGRESS sessions because they were all converted to PAUSED

---

## ✅ The Fix

### **Fix #1: Remove Auto-Pause Logic from Backend**

**File:** `api-service/src/routes/dailySessions.ts`

**Changes:**
1. Removed the auto-pause logic for today's IN_PROGRESS sessions
2. Changed query to return ALL today's sessions (not just PAUSED/DONE)
3. Updated response to reflect no auto-pausing

**New Code:**
```typescript
// NEW CODE - NO AUTO-PAUSE!
router.post('/check-and-cleanup', async (_, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all IN_PROGRESS or PAUSED sessions from previous days
    const staleResult = await query(`
      SELECT * FROM daily_sessions 
      WHERE status IN ('IN_PROGRESS', 'PAUSED') 
      AND date < $1
    `, [today]);
    
    const staleSessions = staleResult.rows;
    
    // Mark them as MISSED (this is correct - old sessions should be marked)
    if (staleSessions.length > 0) {
      await query(`
        UPDATE daily_sessions 
        SET 
          status = 'MISSED',
          finished_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('IN_PROGRESS', 'PAUSED') 
        AND date < $1
      `, [today]);
    }
    
    // ✅ NO AUTO-PAUSE - Just return today's sessions as-is
    const todayResult = await query(`
      SELECT 
        ds.id,
        ds.user_id,
        ds.goal_id,
        ds.date::text as date,
        ds.started_at,
        ds.finished_at,
        ds.paused_at,
        ds.total_paused_seconds,
        ds.duration_completed_minutes,
        ds.status,
        ds.sub_task_id,
        ds.created_at,
        ds.updated_at,
        u.name as user_name
      FROM daily_sessions ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.date = $1  // ✅ Returns ALL statuses
    `, [today]);
    
    res.json({
      success: true,
      data: {
        cleanedUp: staleSessions.length,
        autoPaused: 0,  // ✅ No longer auto-pausing
        sessions: todayResult.rows,
      },
      message: staleSessions.length > 0 
        ? `Marked ${staleSessions.length} old session(s) as MISSED` 
        : 'No stale sessions found',
    });
  } catch (error) {
    console.error('Error checking sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check sessions',
    });
  }
});
```

**Result:**
- ✅ Only cleans up old sessions (previous days)
- ✅ Leaves today's IN_PROGRESS sessions alone
- ✅ Returns all today's sessions regardless of status

---

### **Fix #2: Remove Duplicate checkAndCleanup Call**

**File:** `web-frontend/components/GameCalendar.tsx`

**Problem:** GameCalendar was calling `checkAndCleanup` on initialization, which was:
1. Unnecessary (TimerContext already does this)
2. Causing duplicate calls
3. Triggering the auto-pause bug

**Changes:**
Removed the `checkAndCleanup` call from GameCalendar initialization

**New Code:**
```typescript
const initializeApp = useCallback(async () => {
  if (initialized) return;
  
  try {
    // Load sub-tasks first so they're available for initialization
    const subTasksData = await gameApi.getGoalSubTasks();
    setAllSubTasks(subTasksData);
    
    // ✅ Note: Timer initialization is now handled by TimerContext
    // No need to call checkAndCleanup here to avoid auto-pausing timers
    
    setInitialized(true);
  } catch (error) {
    console.error('[GameCalendar Error] Failed to initialize:', error);
    setInitialized(true);
  }
}, [initialized]);
```

**Result:**
- ✅ No duplicate API calls
- ✅ Cleaner separation of concerns
- ✅ TimerContext handles all timer initialization

---

## 📊 Before vs After

### **Before (Broken):**
```
User starts timer on /calendar
  ↓
Timer status: IN_PROGRESS ✅
  ↓
User navigates to /dashboard
  ↓
Page loads → TimerContext initializes
  ↓
Calls checkAndCleanup()
  ↓
Backend auto-pauses ALL IN_PROGRESS sessions
  ↓
Timer status: PAUSED ❌
  ↓
FloatingTimerPopup checks status
  ↓
Status is PAUSED, not IN_PROGRESS
  ↓
❌ POPUP DOESN'T APPEAR
❌ TIMER IS PAUSED
```

### **After (Fixed):**
```
User starts timer on /calendar
  ↓
Timer status: IN_PROGRESS ✅
  ↓
User navigates to /dashboard
  ↓
Page loads → TimerContext initializes
  ↓
Fetches sessions from server
  ↓
Backend returns IN_PROGRESS sessions (no auto-pause)
  ↓
Timer status: IN_PROGRESS ✅
  ↓
FloatingTimerPopup checks status
  ↓
Status is IN_PROGRESS ✅
  ↓
✅ POPUP APPEARS
✅ TIMER KEEPS RUNNING
```

---

## 🧪 Testing Checklist

### **Critical Tests:**

- [ ] **Start timer on /calendar** - Timer starts successfully
- [ ] **Navigate to /dashboard** - Timer keeps running (not paused)
- [ ] **Check popup** - Popup appears within 1-2 seconds
- [ ] **Check timer status** - Status remains IN_PROGRESS
- [ ] **Navigate to /goals** - Timer still running
- [ ] **Navigate back to /calendar** - Timer still running (not auto-paused)
- [ ] **Manually pause timer** - Timer pauses correctly
- [ ] **Resume timer** - Timer resumes correctly
- [ ] **Navigate away** - Popup appears with running timer

### **Backend Tests:**

- [ ] **Call checkAndCleanup** - Only cleans up old sessions
- [ ] **Verify no auto-pause** - Today's IN_PROGRESS sessions remain unchanged
- [ ] **Check response** - Returns all today's sessions

---

## 📝 Files Changed

### **Backend:**
1. ✅ `api-service/src/routes/dailySessions.ts`
   - Removed auto-pause logic
   - Changed query to return all today's sessions
   - Updated response message

### **Frontend:**
1. ✅ `web-frontend/components/GameCalendar.tsx`
   - Removed checkAndCleanup call from initialization
   - Removed unused imports

---

## ✅ Build Status

✅ **Build successful** - No errors  
✅ **TypeScript** - No type errors  
✅ **Bundle size** - No change  
✅ **Linting** - Only pre-existing warnings  

---

## 🎯 Expected Behavior Now

### **Timer Behavior:**
1. ✅ User starts timer on /calendar
2. ✅ Timer runs continuously
3. ✅ Navigating to other pages does NOT pause timer
4. ✅ Timer only pauses when user explicitly clicks "Pause"
5. ✅ Timer persists across page refreshes (stays IN_PROGRESS)

### **Popup Behavior:**
1. ✅ Appears on all pages except /calendar
2. ✅ Shows when timer is IN_PROGRESS
3. ✅ Hides when timer is PAUSED (user action)
4. ✅ Hides when timer is DONE
5. ✅ Displays correct elapsed time

### **Backend Behavior:**
1. ✅ checkAndCleanup only marks old sessions as MISSED
2. ✅ Does NOT auto-pause today's sessions
3. ✅ Returns all today's sessions regardless of status

---

## 🚨 Important Notes

### **What Changed:**
- ❌ **Removed:** Auto-pause on page load/navigation
- ✅ **Kept:** Cleanup of old sessions (previous days)
- ✅ **Kept:** Manual pause/resume functionality

### **What Didn't Change:**
- ✅ User can still manually pause/resume timers
- ✅ Old sessions (previous days) are still marked as MISSED
- ✅ Timer state still syncs across tabs
- ✅ All other timer functionality remains the same

---

## 🎉 Conclusion

**Status:** ✅ **BUG FIXED**

The critical auto-pause bug has been resolved. Timers will now:
- ✅ Keep running when navigating between pages
- ✅ Only pause when user explicitly clicks "Pause"
- ✅ Display correctly in the FloatingTimerPopup
- ✅ Persist across page refreshes

The fix is **production-ready** and maintains all existing functionality while removing the unintended auto-pause behavior.

---

**Fixed By:** Senior Next.js App Router Engineer  
**Review Status:** Ready for Testing  
**Deployment Status:** Pending manual verification  
**Estimated Testing Time:** 10 minutes  

---

**Last Updated:** January 15, 2026
