# Design Document: Goal Sub-Tasks Feature

## Overview

This feature extends the existing goal tracking system to support splitting daily goals into smaller, trackable sub-tasks. Users can configure their daily goal (e.g., "2 hours") as multiple activities (e.g., "1 hour learning English" + "1 hour gym"), track each activity independently, and have the system automatically mark the main goal as complete when all sub-tasks are done.

The design maintains backward compatibility with existing goals that don't use sub-tasks, allowing both tracking modes to coexist.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Settings Page          Calendar Page         Dashboard      │
│  - Sub-task config      - Sub-task display    - Progress     │
│  - Duration validation  - Individual tracking - Summary      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  /api/goal-sub-tasks/*     /api/daily-sessions/*            │
│  - CRUD operations         - Session tracking                │
│  - Validation logic        - Progress calculation            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
├─────────────────────────────────────────────────────────────┤
│  goal_sub_tasks            daily_sessions                    │
│  - Sub-task definitions    - Session records                 │
│  - Duration allocation     - Sub-task linkage                │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Configuration Flow**: User configures sub-tasks in Settings → API validates and saves → Database stores sub-task definitions
2. **Tracking Flow**: User starts sub-task on Calendar → API creates session with sub_task_id → Database records progress
3. **Completion Flow**: User completes sub-task → API checks all sub-tasks → System marks main goal as DONE if all complete

## Components and Interfaces

### Database Schema

#### New Table: goal_sub_tasks

```sql
CREATE TABLE goal_sub_tasks (
    id SERIAL PRIMARY KEY,
    user_goal_id INTEGER NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_goal_id, display_order)
);

CREATE INDEX idx_goal_sub_tasks_user_goal_id ON goal_sub_tasks(user_goal_id);
CREATE INDEX idx_goal_sub_tasks_display_order ON goal_sub_tasks(display_order);
```

#### Modified Table: daily_sessions

```sql
ALTER TABLE daily_sessions 
ADD COLUMN sub_task_id INTEGER REFERENCES goal_sub_tasks(id) ON DELETE CASCADE;

CREATE INDEX idx_daily_sessions_sub_task_id ON daily_sessions(sub_task_id);
```

### Backend API Endpoints

#### Goal Sub-Tasks Management

**GET /api/goal-sub-tasks/:userGoalId**
- Retrieves all sub-tasks for a specific user goal
- Returns: Array of sub-tasks ordered by display_order
- Response format:
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    user_goal_id: number;
    title: string;
    duration_minutes: number;
    display_order: number;
    created_at: string;
    updated_at: string;
  }>;
}
```

**POST /api/goal-sub-tasks**
- Creates a new sub-task
- Request body:
```typescript
{
  user_goal_id: number;
  title: string;
  duration_minutes: number;
  display_order?: number;
}
```
- Validation: Checks that total duration doesn't exceed main goal duration
- Returns: Created sub-task object

**PUT /api/goal-sub-tasks/:id**
- Updates an existing sub-task
- Request body: Same as POST (partial updates allowed)
- Validation: Recalculates total duration with new values
- Returns: Updated sub-task object

**DELETE /api/goal-sub-tasks/:id**
- Deletes a sub-task and its associated sessions
- Returns: Success confirmation

**POST /api/goal-sub-tasks/validate**
- Validates sub-task configuration without saving
- Request body:
```typescript
{
  user_goal_id: number;
  sub_tasks: Array<{
    id?: number;
    duration_minutes: number;
  }>;
}
```
- Returns: Validation result with total duration and remaining time

#### Enhanced Daily Sessions Endpoints

**GET /api/daily-sessions/with-sub-tasks**
- Retrieves sessions grouped by sub-tasks
- Query parameters: userId, goalId, date, startDate, endDate
- Response format:
```typescript
{
  success: boolean;
  data: {
    date: string;
    user_id: number;
    goal_id: number;
    main_goal_status: 'DONE' | 'MISSED' | 'IN_PROGRESS' | 'PAUSED' | null;
    sub_tasks: Array<{
      sub_task_id: number;
      sub_task_title: string;
      duration_minutes: number;
      session: {
        id: number;
        status: string;
        duration_completed_minutes: number;
        started_at: string;
        finished_at: string;
      } | null;
    }>;
  }[];
}
```

**POST /api/daily-sessions/start-sub-task**
- Starts a session for a specific sub-task
- Request body:
```typescript
{
  user_id: number;
  goal_id: number;
  sub_task_id: number;
  date: string;
}
```
- Creates session with sub_task_id reference
- Returns: Created session object

**POST /api/daily-sessions/complete-sub-task**
- Marks a sub-task session as complete
- Automatically checks if all sub-tasks are done
- If all done, marks main goal as DONE
- Returns: Updated session and main goal status

### Frontend Components

#### SubTaskManager Component (Settings Page)

```typescript
interface SubTaskManagerProps {
  userGoal: UserGoal;
  onUpdate: () => void;
}

interface SubTask {
  id?: number;
  title: string;
  duration_minutes: number;
  display_order: number;
}
```

Features:
- Display list of existing sub-tasks
- Add new sub-task form
- Edit sub-task inline
- Delete sub-task with confirmation
- Real-time duration validation
- Visual progress bar showing allocated vs. total time
- Drag-and-drop reordering

#### SubTaskCalendarView Component (Calendar Page)

```typescript
interface SubTaskCalendarViewProps {
  date: string;
  userId: number;
  goalId: number;
  subTasks: SubTask[];
  sessions: SessionWithSubTask[];
  onStartSubTask: (subTaskId: number) => void;
  onCompleteSubTask: (sessionId: number) => void;
}
```

Features:
- Display all sub-tasks for a day
- Show completion status for each sub-task
- Start/stop buttons for each sub-task
- Progress indicator (e.g., "2/3 tasks done, 90/120 minutes")
- Visual distinction between completed and pending sub-tasks
- Fallback to main goal view if no sub-tasks configured

#### SubTaskProgressBar Component

```typescript
interface SubTaskProgressBarProps {
  completedTasks: number;
  totalTasks: number;
  completedMinutes: number;
  totalMinutes: number;
}
```

Features:
- Dual progress display (tasks and time)
- Color-coded segments for each sub-task
- Animated transitions on completion
- Tooltip showing details on hover

## Data Models

### TypeScript Interfaces

```typescript
// Goal Sub-Task
interface GoalSubTask {
  id: number;
  user_goal_id: number;
  title: string;
  duration_minutes: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Enhanced Daily Session
interface DailySessionWithSubTask extends DailySession {
  sub_task_id: number | null;
  sub_task_title?: string;
  sub_task_duration?: number;
}

// Sub-Task Progress
interface SubTaskProgress {
  date: string;
  user_id: number;
  goal_id: number;
  main_goal_status: SessionStatus | null;
  total_duration_minutes: number;
  completed_duration_minutes: number;
  sub_tasks: Array<{
    sub_task_id: number;
    title: string;
    duration_minutes: number;
    status: SessionStatus | null;
    completed_minutes: number;
  }>;
}

// Validation Result
interface SubTaskValidationResult {
  valid: boolean;
  total_duration_minutes: number;
  main_goal_duration_minutes: number;
  remaining_minutes: number;
  errors: string[];
  warnings: string[];
}
```

## Error Handling

### Validation Errors

1. **Duration Mismatch**: Total sub-task duration exceeds main goal duration
   - Error message: "Sub-tasks total {X} minutes exceeds goal duration of {Y} minutes"
   - Action: Prevent save, highlight invalid sub-tasks

2. **Incomplete Allocation**: Total sub-task duration less than main goal duration
   - Warning message: "You have {X} minutes unallocated. Add more sub-tasks or adjust durations."
   - Action: Allow save but show warning

3. **Empty Title**: Sub-task created without a title
   - Error message: "Sub-task title is required"
   - Action: Prevent save, focus on title field

4. **Zero Duration**: Sub-task created with 0 or negative duration
   - Error message: "Sub-task duration must be greater than 0"
   - Action: Prevent save, highlight duration field

### Runtime Errors

1. **Session Conflict**: Attempting to start multiple sub-tasks simultaneously
   - Error message: "You already have an active session. Please complete or pause it first."
   - Action: Prevent new session, highlight active session

2. **Missing Sub-Task**: Session references deleted sub-task
   - Error handling: Gracefully handle null sub_task_id, show as "Deleted Sub-Task"
   - Action: Allow viewing but prevent editing

3. **Database Constraint Violation**: Foreign key or unique constraint error
   - Error message: "Unable to save changes. Please try again."
   - Action: Log error, show generic message to user

### User Feedback

- Success messages: Green toast notifications with checkmark icon
- Error messages: Red toast notifications with error icon
- Warning messages: Yellow toast notifications with warning icon
- Loading states: Skeleton loaders and disabled buttons during API calls

## Testing Strategy

### Unit Tests

1. **Duration Validation Logic**
   - Test: Sum of sub-task durations equals main goal duration
   - Test: Sum exceeds main goal duration (should fail)
   - Test: Sum is less than main goal duration (should warn)
   - Test: Edge cases (0 duration, negative duration, very large numbers)

2. **Sub-Task CRUD Operations**
   - Test: Create sub-task with valid data
   - Test: Update sub-task title and duration
   - Test: Delete sub-task and verify cascade deletion of sessions
   - Test: Reorder sub-tasks by display_order

3. **Session Tracking Logic**
   - Test: Start sub-task session creates correct database record
   - Test: Complete sub-task marks it as DONE
   - Test: Complete all sub-tasks marks main goal as DONE
   - Test: Partial completion keeps main goal as IN_PROGRESS

4. **Progress Calculation**
   - Test: Calculate completed tasks out of total
   - Test: Calculate completed minutes out of total
   - Test: Handle edge cases (no sub-tasks, all complete, none complete)

### Integration Tests

1. **End-to-End Sub-Task Flow**
   - Test: User creates sub-tasks in settings → Saves → Views on calendar → Starts session → Completes → Verifies main goal status
   
2. **Backward Compatibility**
   - Test: Existing goals without sub-tasks continue to work
   - Test: Adding sub-tasks to existing goal doesn't break past sessions
   - Test: Removing all sub-tasks reverts to main goal tracking

3. **Multi-User Scenarios**
   - Test: Two users with different sub-task configurations
   - Test: One user with sub-tasks, another without
   - Test: Both users completing their respective goals

### Property-Based Tests

Property-based tests will be defined in the Correctness Properties section below.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Completion Propagation**: Criteria 3.4 and 4.5 both test that completing all sub-tasks marks the main goal as DONE - these can be combined into one comprehensive property
2. **Duration Validation**: Criteria 2.1, 2.2, 2.3, and 2.4 all test aspects of duration validation - these can be combined into a single property that validates all cases
3. **UI Rendering**: Multiple criteria (1.5, 3.1, 3.2, 10.5) test that sub-tasks are displayed with correct information - these can be combined
4. **Progress Calculation**: Criteria 5.1, 5.2, and 5.3 all test progress calculation - these can be combined into one property

### Core Properties

**Property 1: Sub-Task Duration Validation**

*For any* set of sub-tasks and main goal duration, the validation function should return:
- Valid (true) if and only if the sum of sub-task durations equals the main goal duration
- Error if the sum exceeds the main goal duration
- Warning if the sum is less than the main goal duration

**Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 6.2**

**Property 2: Sub-Task Persistence Round-Trip**

*For any* valid set of sub-tasks, saving them to the database and then retrieving them should return sub-tasks with equivalent data (id may differ, but title, duration, and order should match)

**Validates: Requirements 1.4**

**Property 3: Required Field Validation**

*For any* sub-task creation attempt with missing title or missing/invalid duration, the system should reject the creation and return a validation error

**Validates: Requirements 1.2**

**Property 4: Completion Propagation Invariant**

*For any* day with sub-tasks configured, the main goal status should be:
- DONE if and only if all sub-tasks are marked as DONE
- IN_PROGRESS if at least one sub-task is IN_PROGRESS and none are MISSED
- MISSED if any sub-task is MISSED
- null if no sessions have been started

**Validates: Requirements 3.4, 4.5, 5.5**

**Property 5: Session Sub-Task Linkage**

*For any* sub-task session that is started, the created session record should have a non-null sub_task_id that references the correct sub-task

**Validates: Requirements 4.1**

**Property 6: Session Completion Status**

*For any* sub-task session:
- If the session duration reaches or exceeds the target duration, the status should be DONE
- If the session is stopped before reaching the target duration, the status should be MISSED

**Validates: Requirements 4.2, 4.3, 4.4**

**Property 7: Progress Calculation Accuracy**

*For any* day with sub-tasks, the progress calculation should return:
- Completed task count = number of sub-tasks with status DONE
- Total task count = total number of sub-tasks
- Completed minutes = sum of duration_completed_minutes for all sessions
- Total minutes = sum of duration_minutes for all sub-tasks

**Validates: Requirements 5.1, 5.2, 5.3**

**Property 8: Sub-Task Display Completeness**

*For any* user goal with sub-tasks configured, the rendered UI should contain:
- All sub-task titles
- All sub-task durations
- Edit and delete actions for each sub-task
- Visual indicators for completion status

**Validates: Requirements 1.5, 3.1, 3.2, 3.3, 10.5**

**Property 9: Title Edit Isolation**

*For any* sub-task with existing sessions, editing the title should update the sub-task title without modifying any session data (session IDs, durations, statuses should remain unchanged)

**Validates: Requirements 6.1**

**Property 10: Cascade Deletion**

*For any* sub-task that is deleted, all associated sessions should also be deleted from the database, and affected days should have their main goal status recalculated

**Validates: Requirements 6.4, 6.5**

**Property 11: Foreign Key Integrity**

*For any* attempt to create a sub-task with an invalid user_goal_id or a session with an invalid sub_task_id, the database should reject the operation with a foreign key constraint error

**Validates: Requirements 8.3, 8.4**

**Property 12: Cascade Delete on User Goal**

*For any* user_goal that is deleted, all associated sub-tasks and their sessions should be automatically deleted from the database

**Validates: Requirements 8.5**

**Property 13: Backward Compatibility**

*For any* goal without sub-tasks configured (sub_task_id is null in sessions), the system should:
- Track sessions at the main goal level
- Display only the main goal on the calendar
- Calculate status based on main goal duration
- Function identically to the pre-sub-task implementation

**Validates: Requirements 7.1, 7.2, 7.4, 7.5**

**Property 14: Real-Time Validation Feedback**

*For any* user input in the sub-task form, the validation feedback should update immediately to reflect:
- Current total duration
- Remaining unallocated time
- Validation errors or warnings
- Success state when durations match

**Validates: Requirements 10.3**

### Edge Case Properties

**Edge Case 1: Empty Sub-Task List**

*For any* goal with zero sub-tasks, the system should behave as if sub-tasks are not configured (backward compatibility mode)

**Edge Case 2: Single Sub-Task**

*For any* goal with exactly one sub-task, the sub-task duration should equal the main goal duration, and completing it should mark the main goal as DONE

**Edge Case 3: Maximum Sub-Tasks**

*For any* goal with a large number of sub-tasks (e.g., 20+), the system should handle display, validation, and tracking without performance degradation

**Edge Case 4: Concurrent Session Attempts**

*For any* attempt to start multiple sub-task sessions simultaneously for the same user and goal, the system should reject all but the first and return an error

**Edge Case 5: Orphaned Sessions**

*For any* session that references a deleted sub-task (orphaned by race condition or data corruption), the system should handle it gracefully by displaying "Deleted Sub-Task" and preventing further edits

### Testing Configuration

All property-based tests should:
- Run a minimum of 100 iterations per property
- Use appropriate generators for test data (sub-tasks, durations, sessions)
- Tag tests with format: **Feature: goal-sub-tasks, Property {number}: {property_text}**
- Use the property-based testing library appropriate for the language (e.g., fast-check for TypeScript/JavaScript)

