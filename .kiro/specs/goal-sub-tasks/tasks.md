# Implementation Plan: Goal Sub-Tasks Feature

## Overview

This implementation plan breaks down the Goal Sub-Tasks feature into discrete, incremental tasks. The approach follows a bottom-up strategy: database → backend API → frontend components → integration.

## Tasks

- [ ] 1. Database Schema Setup
  - Create `goal_sub_tasks` table with proper constraints
  - Add `sub_task_id` column to `daily_sessions` table
  - Create indexes for performance
  - Add foreign key constraints with cascade delete
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.1 Write property test for foreign key constraints
  - **Property 11: Foreign Key Integrity**
  - **Validates: Requirements 8.3, 8.4**

- [ ] 1.2 Write property test for cascade deletion
  - **Property 12: Cascade Delete on User Goal**
  - **Validates: Requirements 8.5**

- [ ] 2. Backend Type Definitions
  - Create TypeScript interfaces for GoalSubTask
  - Create TypeScript interfaces for DailySessionWithSubTask
  - Create TypeScript interfaces for SubTaskProgress
  - Create TypeScript interfaces for SubTaskValidationResult
  - Add types to existing type files
  - _Requirements: All (foundational)_

- [ ] 3. Sub-Task Validation Logic
  - [ ] 3.1 Implement duration validation function
    - Calculate total duration from sub-task array
    - Compare against main goal duration
    - Return validation result with errors/warnings
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 3.2 Write property test for duration validation
  - **Property 1: Sub-Task Duration Validation**
  - **Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 6.2**

- [ ] 3.3 Write property test for required field validation
  - **Property 3: Required Field Validation**
  - **Validates: Requirements 1.2**

- [ ] 4. Sub-Task CRUD API Endpoints
  - [ ] 4.1 Implement GET /api/goal-sub-tasks/:userGoalId
    - Query database for sub-tasks by user_goal_id
    - Order by display_order
    - Return formatted response
    - _Requirements: 9.1_

- [ ] 4.2 Implement POST /api/goal-sub-tasks
    - Validate request body (title, duration required)
    - Run duration validation against main goal
    - Insert into database with auto-incremented display_order
    - Return created sub-task
    - _Requirements: 1.2, 1.3, 9.2_

- [ ] 4.3 Implement PUT /api/goal-sub-tasks/:id
    - Validate request body
    - Re-run duration validation with updated values
    - Update database record
    - Return updated sub-task
    - _Requirements: 6.1, 6.2, 9.3_

- [ ] 4.4 Implement DELETE /api/goal-sub-tasks/:id
    - Delete sub-task (cascade deletes sessions automatically)
    - Recalculate main goal status for affected days
    - Return success confirmation
    - _Requirements: 6.4, 6.5, 9.4_

- [ ] 4.5 Implement POST /api/goal-sub-tasks/validate
    - Accept array of sub-tasks with durations
    - Run validation logic
    - Return validation result without saving
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4.6 Write property test for sub-task persistence
  - **Property 2: Sub-Task Persistence Round-Trip**
  - **Validates: Requirements 1.4**

- [ ] 4.7 Write property test for title edit isolation
  - **Property 9: Title Edit Isolation**
  - **Validates: Requirements 6.1**

- [ ] 4.8 Write property test for cascade deletion
  - **Property 10: Cascade Deletion**
  - **Validates: Requirements 6.4, 6.5**

- [ ] 5. Enhanced Daily Sessions API
  - [ ] 5.1 Implement GET /api/daily-sessions/with-sub-tasks
    - Query sessions with sub-task information
    - Group by date, user, and goal
    - Calculate main goal status from sub-tasks
    - Return formatted response with progress
    - _Requirements: 9.5_

- [ ] 5.2 Implement POST /api/daily-sessions/start-sub-task
    - Validate sub-task exists
    - Check for existing active sessions
    - Create session with sub_task_id
    - Return created session
    - _Requirements: 4.1_

- [ ] 5.3 Implement POST /api/daily-sessions/complete-sub-task
    - Mark sub-task session as DONE
    - Check if all sub-tasks for the day are DONE
    - If all done, mark main goal as DONE
    - Return updated session and main goal status
    - _Requirements: 4.2, 4.3, 4.5_

- [ ] 5.4 Add logic to handle early session stop
    - Mark sub-task session as MISSED if stopped early
    - Update main goal status accordingly
    - _Requirements: 4.4_

- [ ] 5.5 Write property test for session sub-task linkage
  - **Property 5: Session Sub-Task Linkage**
  - **Validates: Requirements 4.1**

- [ ] 5.6 Write property test for session completion status
  - **Property 6: Session Completion Status**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 5.7 Write property test for completion propagation
  - **Property 4: Completion Propagation Invariant**
  - **Validates: Requirements 3.4, 4.5, 5.5**

- [ ] 6. Progress Calculation Service
  - [ ] 6.1 Implement progress calculation function
    - Count completed vs total sub-tasks
    - Sum completed vs total minutes
    - Calculate percentage completion
    - Return progress object
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6.2 Write property test for progress calculation
  - **Property 7: Progress Calculation Accuracy**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 7. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Test API endpoints manually with Postman/curl
  - Verify database constraints work correctly
  - Ask the user if questions arise

- [ ] 8. Frontend API Client Functions
  - [ ] 8.1 Create gameApi.getSubTasks(userGoalId)
    - Call GET /api/goal-sub-tasks/:userGoalId
    - Return typed response
    - _Requirements: 9.1_

- [ ] 8.2 Create gameApi.createSubTask(data)
    - Call POST /api/goal-sub-tasks
    - Handle validation errors
    - Return created sub-task
    - _Requirements: 9.2_

- [ ] 8.3 Create gameApi.updateSubTask(id, data)
    - Call PUT /api/goal-sub-tasks/:id
    - Handle validation errors
    - Return updated sub-task
    - _Requirements: 9.3_

- [ ] 8.4 Create gameApi.deleteSubTask(id)
    - Call DELETE /api/goal-sub-tasks/:id
    - Return success confirmation
    - _Requirements: 9.4_

- [ ] 8.5 Create gameApi.validateSubTasks(userGoalId, subTasks)
    - Call POST /api/goal-sub-tasks/validate
    - Return validation result
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 8.6 Create gameApi.getSessionsWithSubTasks(params)
    - Call GET /api/daily-sessions/with-sub-tasks
    - Return typed response with progress
    - _Requirements: 9.5_

- [ ] 8.7 Create gameApi.startSubTaskSession(data)
    - Call POST /api/daily-sessions/start-sub-task
    - Return created session
    - _Requirements: 4.1_

- [ ] 8.8 Create gameApi.completeSubTaskSession(sessionId)
    - Call POST /api/daily-sessions/complete-sub-task
    - Return updated session and main goal status
    - _Requirements: 4.2, 4.3_

- [ ] 9. SubTaskManager Component (Settings Page)
  - [ ] 9.1 Create SubTaskManager component structure
    - Accept userGoal prop
    - Set up state for sub-tasks and validation
    - Implement useEffect to load sub-tasks
    - _Requirements: 1.1, 1.5_

- [ ] 9.2 Implement sub-task list display
    - Map over sub-tasks array
    - Display title, duration, and order
    - Show edit and delete buttons for each
    - _Requirements: 1.5, 10.5_

- [ ] 9.3 Implement "Add Sub-Task" functionality
    - Add button to show form
    - Create form with title and duration inputs
    - Handle form submission
    - Call API to create sub-task
    - _Requirements: 1.1, 1.2, 10.1, 10.2_

- [ ] 9.4 Implement real-time validation feedback
    - Calculate total duration as user types
    - Show remaining/excess time
    - Display error/warning/success indicators
    - Disable save button when invalid
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.3_

- [ ] 9.5 Implement edit sub-task functionality
    - Make sub-task fields editable inline
    - Re-run validation on changes
    - Call API to update sub-task
    - _Requirements: 6.1, 6.2_

- [ ] 9.6 Implement delete sub-task functionality
    - Show confirmation dialog
    - Call API to delete sub-task
    - Refresh sub-task list
    - _Requirements: 6.3, 6.4_

- [ ] 9.7 Add drag-and-drop reordering
    - Implement drag handlers
    - Update display_order on drop
    - Call API to save new order
    - _Requirements: (enhancement)_

- [ ] 9.8 Write property test for sub-task display
  - **Property 8: Sub-Task Display Completeness**
  - **Validates: Requirements 1.5, 3.1, 3.2, 3.3, 10.5**

- [ ] 9.9 Write property test for real-time validation
  - **Property 14: Real-Time Validation Feedback**
  - **Validates: Requirements 10.3**

- [ ] 10. SubTaskProgressBar Component
  - [ ] 10.1 Create SubTaskProgressBar component
    - Accept completedTasks, totalTasks, completedMinutes, totalMinutes props
    - Calculate percentages
    - Render dual progress bars (tasks and time)
    - _Requirements: 5.2, 5.3_

- [ ] 10.2 Add visual styling and animations
    - Color-code segments by sub-task
    - Animate transitions on completion
    - Add tooltips with details
    - _Requirements: 5.4_

- [ ] 11. SubTaskCalendarView Component
  - [ ] 11.1 Create SubTaskCalendarView component structure
    - Accept date, userId, goalId, subTasks, sessions props
    - Set up state for active session
    - Implement useEffect to load sessions
    - _Requirements: 3.1_

- [ ] 11.2 Implement sub-task list display for calendar
    - Map over sub-tasks
    - Show title, duration, and completion status
    - Display checkmark for completed sub-tasks
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 11.3 Implement start sub-task session
    - Add start button for each sub-task
    - Call API to start session
    - Update UI to show active session
    - Start timer countdown
    - _Requirements: 4.1_

- [ ] 11.4 Implement complete sub-task session
    - Add complete button for active session
    - Call API to complete session
    - Update UI to show completion
    - Check if main goal is now DONE
    - _Requirements: 4.2, 4.3, 4.5_

- [ ] 11.5 Implement stop session early
    - Add stop button for active session
    - Call API to stop session (marks as MISSED)
    - Update UI accordingly
    - _Requirements: 4.4_

- [ ] 11.6 Add progress indicator
    - Use SubTaskProgressBar component
    - Show completed/total tasks and time
    - Update in real-time as sessions complete
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 11.7 Implement fallback for goals without sub-tasks
    - Check if sub-tasks exist
    - If not, render main goal view (existing behavior)
    - Ensure backward compatibility
    - _Requirements: 3.5, 7.1, 7.2_

- [ ] 11.8 Write property test for backward compatibility
  - **Property 13: Backward Compatibility**
  - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

- [ ] 12. Integrate SubTaskManager into Settings Page
  - [ ] 12.1 Import SubTaskManager component
    - Add to settings page
    - Pass userGoal props
    - Handle onUpdate callback
    - _Requirements: 1.1, 10.1_

- [ ] 12.2 Add UI section for sub-task configuration
    - Add expandable section for each goal
    - Show "Configure Sub-Tasks" button
    - Display SubTaskManager when expanded
    - _Requirements: 1.1_

- [ ] 12.3 Add success/error toast notifications
    - Show success on save
    - Show errors on validation failure
    - Show warnings for partial allocation
    - _Requirements: 10.4_

- [ ] 13. Integrate SubTaskCalendarView into Calendar Page
  - [ ] 13.1 Import SubTaskCalendarView component
    - Add to calendar page
    - Pass necessary props (date, user, goal, sub-tasks, sessions)
    - _Requirements: 3.1_

- [ ] 13.2 Modify calendar day rendering logic
    - Check if goal has sub-tasks
    - If yes, render SubTaskCalendarView
    - If no, render existing main goal view
    - _Requirements: 3.1, 3.5_

- [ ] 13.3 Handle session state updates
    - Refresh calendar on session start/complete
    - Update main goal status indicator
    - Show real-time progress
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 14. Edge Case Handling
  - [ ] 14.1 Handle empty sub-task list
    - Detect when sub-tasks array is empty
    - Fall back to main goal tracking
    - _Requirements: 7.4_

- [ ] 14.2 Handle single sub-task
    - Ensure validation works with one sub-task
    - Verify completion propagates correctly
    - _Requirements: (edge case)_

- [ ] 14.3 Handle concurrent session attempts
    - Check for active sessions before starting new one
    - Return error if session already active
    - Display error message to user
    - _Requirements: (edge case)_

- [ ] 14.4 Handle orphaned sessions
    - Detect sessions with deleted sub-task references
    - Display "Deleted Sub-Task" label
    - Prevent editing orphaned sessions
    - _Requirements: (edge case)_

- [ ] 14.5 Write edge case property tests
  - **Edge Cases 1-5**
  - Test empty list, single sub-task, max sub-tasks, concurrency, orphaned sessions

- [ ] 15. Final Integration Testing
  - [ ] 15.1 Test complete user flow
    - Create goal with sub-tasks in settings
    - View sub-tasks on calendar
    - Start and complete sub-task sessions
    - Verify main goal marked as DONE
    - _Requirements: All_

- [ ] 15.2 Test backward compatibility
    - Verify existing goals without sub-tasks still work
    - Test adding sub-tasks to existing goal
    - Test removing all sub-tasks from goal
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15.3 Test multi-user scenarios
    - User 1 with sub-tasks, User 2 without
    - Both users completing their goals
    - Verify independent tracking
    - _Requirements: 7.5_

- [ ] 15.4 Write integration tests
  - Test end-to-end flows
  - Test multi-user scenarios
  - Test backward compatibility

- [ ] 16. Final Checkpoint - Feature Complete
  - Ensure all tests pass (unit, property, integration)
  - Verify all requirements are met
  - Test in production-like environment
  - Ask the user for final review and feedback

## Notes

- All tasks including tests are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → backend → frontend → integration
