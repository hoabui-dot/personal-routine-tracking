# Requirements Document

## Introduction

This feature allows users to split their daily goal hours into smaller sub-tasks with specific activities. For example, a user with a 2-hour daily goal can configure it as "1 hour learning English + 1 hour gym". Users can track each sub-task independently, and when all sub-tasks are completed, the main goal is automatically marked as DONE.

## Glossary

- **Main_Goal**: The primary daily goal with a total duration target (e.g., "2 hours daily")
- **Sub_Task**: A smaller activity within a main goal with its own duration and description (e.g., "1 hour learning English")
- **Daily_Session**: A tracking session for either a main goal or a sub-task on a specific date
- **System**: The Capybara Tracker application (frontend, backend, and database)
- **User**: A player in the two-player goal tracking game
- **Settings_Page**: The configuration interface where users manage their goals and sub-tasks

## Requirements

### Requirement 1: Sub-Task Configuration

**User Story:** As a user, I want to split my daily goal hours into multiple sub-tasks with specific activities, so that I can track different activities that contribute to my overall goal.

#### Acceptance Criteria

1. WHEN a user accesses the settings page, THE System SHALL display an option to add sub-tasks for each goal
2. WHEN a user creates a sub-task, THE System SHALL require a title and duration in minutes
3. WHEN a user creates sub-tasks, THE System SHALL validate that the sum of all sub-task durations equals the main goal duration
4. WHEN a user saves sub-task configuration, THE System SHALL persist the sub-tasks to the database
5. WHEN a user has sub-tasks configured, THE System SHALL display them in the settings page with edit and delete options

### Requirement 2: Sub-Task Duration Validation

**User Story:** As a user, I want the system to ensure my sub-task durations add up correctly, so that I don't accidentally configure invalid time allocations.

#### Acceptance Criteria

1. WHEN a user adds or edits sub-tasks, THE System SHALL calculate the total duration of all sub-tasks
2. IF the total sub-task duration exceeds the main goal duration, THEN THE System SHALL display an error message and prevent saving
3. IF the total sub-task duration is less than the main goal duration, THEN THE System SHALL display a warning showing the remaining unallocated time
4. WHEN all sub-task durations sum to the main goal duration, THE System SHALL display a success indicator
5. WHEN a user changes the main goal duration, THE System SHALL validate existing sub-tasks and warn if they no longer match

### Requirement 3: Calendar Display with Sub-Tasks

**User Story:** As a user, I want to see my sub-tasks on the calendar, so that I can track which specific activities I need to complete each day.

#### Acceptance Criteria

1. WHEN a user views the calendar and has sub-tasks configured, THE System SHALL display all sub-tasks for each day instead of just the main goal
2. WHEN displaying sub-tasks on the calendar, THE System SHALL show the title and duration for each sub-task
3. WHEN a sub-task is completed, THE System SHALL mark it with a visual indicator (e.g., checkmark)
4. WHEN all sub-tasks for a day are completed, THE System SHALL mark the main goal as DONE
5. WHEN viewing a day without sub-tasks configured, THE System SHALL display the main goal as before

### Requirement 4: Sub-Task Session Tracking

**User Story:** As a user, I want to start and complete individual sub-tasks, so that I can track my progress on specific activities throughout the day.

#### Acceptance Criteria

1. WHEN a user starts a sub-task session, THE System SHALL create a session record linked to that specific sub-task
2. WHEN a user completes a sub-task session, THE System SHALL mark that sub-task as DONE for the day
3. WHEN a sub-task session duration reaches its target, THE System SHALL automatically mark it as complete
4. WHEN a user stops a sub-task session early, THE System SHALL mark it as MISSED
5. WHEN all sub-tasks for a day are marked as DONE, THE System SHALL automatically mark the main goal as DONE

### Requirement 5: Sub-Task Progress Calculation

**User Story:** As a user, I want to see my overall progress when I complete sub-tasks, so that I know how close I am to completing my daily goal.

#### Acceptance Criteria

1. WHEN a user completes a sub-task, THE System SHALL calculate the total completed duration for the day
2. WHEN displaying progress, THE System SHALL show completed sub-tasks out of total sub-tasks (e.g., "2/3 tasks done")
3. WHEN displaying progress, THE System SHALL show completed time out of total time (e.g., "90/120 minutes")
4. WHEN a user views the calendar, THE System SHALL display progress indicators for days with partial completion
5. FOR ALL days with sub-tasks, the main goal status SHALL be derived from sub-task completion status

### Requirement 6: Sub-Task Management

**User Story:** As a user, I want to edit or delete my sub-tasks, so that I can adjust my activity breakdown as my needs change.

#### Acceptance Criteria

1. WHEN a user edits a sub-task title, THE System SHALL update the title without affecting existing session data
2. WHEN a user edits a sub-task duration, THE System SHALL validate the new total duration against the main goal
3. WHEN a user deletes a sub-task, THE System SHALL prompt for confirmation
4. WHEN a user confirms sub-task deletion, THE System SHALL remove the sub-task and its associated sessions
5. WHEN a user deletes a sub-task with completed sessions, THE System SHALL recalculate the main goal status for affected days

### Requirement 7: Backward Compatibility

**User Story:** As a user with existing goals without sub-tasks, I want the system to continue working as before, so that my current tracking is not disrupted.

#### Acceptance Criteria

1. WHEN a user has no sub-tasks configured for a goal, THE System SHALL track sessions at the main goal level as before
2. WHEN displaying the calendar for goals without sub-tasks, THE System SHALL show the main goal only
3. WHEN a user adds sub-tasks to an existing goal, THE System SHALL migrate future sessions to use sub-tasks
4. WHEN a user removes all sub-tasks from a goal, THE System SHALL revert to main goal tracking
5. THE System SHALL support both sub-task mode and main goal mode simultaneously for different goals

### Requirement 8: Database Schema

**User Story:** As a system architect, I want a proper database schema for sub-tasks, so that the data is stored efficiently and maintains referential integrity.

#### Acceptance Criteria

1. THE System SHALL create a goal_sub_tasks table with columns: id, user_goal_id, title, duration_minutes, display_order, created_at, updated_at
2. THE System SHALL add a sub_task_id column to daily_sessions table (nullable for backward compatibility)
3. THE System SHALL enforce foreign key constraints between goal_sub_tasks and user_goals
4. THE System SHALL enforce foreign key constraints between daily_sessions and goal_sub_tasks
5. WHEN a user_goal is deleted, THE System SHALL cascade delete all associated sub-tasks and sessions

### Requirement 9: API Endpoints

**User Story:** As a frontend developer, I want RESTful API endpoints for sub-task management, so that I can build the user interface.

#### Acceptance Criteria

1. THE System SHALL provide GET /api/goal-sub-tasks/:userGoalId endpoint to retrieve all sub-tasks for a user goal
2. THE System SHALL provide POST /api/goal-sub-tasks endpoint to create a new sub-task
3. THE System SHALL provide PUT /api/goal-sub-tasks/:id endpoint to update a sub-task
4. THE System SHALL provide DELETE /api/goal-sub-tasks/:id endpoint to delete a sub-task
5. THE System SHALL provide GET /api/daily-sessions/with-sub-tasks endpoint to retrieve sessions grouped by sub-tasks

### Requirement 10: Settings UI Enhancement

**User Story:** As a user, I want an intuitive interface in settings to manage my sub-tasks, so that I can easily configure my activity breakdown.

#### Acceptance Criteria

1. WHEN a user views settings, THE System SHALL display an "Add Sub-Task" button for each goal
2. WHEN a user clicks "Add Sub-Task", THE System SHALL show a form with title and duration fields
3. WHEN a user enters sub-task details, THE System SHALL show real-time validation feedback
4. WHEN a user saves sub-tasks, THE System SHALL display a success message and update the UI
5. WHEN a user has sub-tasks configured, THE System SHALL display them in a list with edit/delete actions
