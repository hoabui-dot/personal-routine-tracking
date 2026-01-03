/**
 * Property-Based Tests for Goal Sub-Tasks Foreign Key Constraints
 * Feature: goal-sub-tasks, Property 11: Foreign Key Integrity
 * Validates: Requirements 8.3, 8.4
 */

import { query } from '../db';
import * as fc from 'fast-check';

describe('Goal Sub-Tasks Foreign Key Constraints', () => {
  // Helper to create a test user goal
  const createTestUserGoal = async (): Promise<number> => {
    // Get first user
    const userResult = await query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0].id;

    // Get first goal
    const goalResult = await query('SELECT id FROM goals LIMIT 1');
    const goalId = goalResult.rows[0].id;

    // Create or get user_goal
    const userGoalResult = await query(
      `INSERT INTO user_goals (user_id, goal_id, daily_duration_minutes)
       VALUES ($1, $2, 120)
       ON CONFLICT (user_id, goal_id) DO UPDATE SET daily_duration_minutes = 120
       RETURNING id`,
      [userId, goalId]
    );

    return userGoalResult.rows[0].id;
  };

  // Helper to create a test sub-task
  const createTestSubTask = async (userGoalId: number): Promise<number> => {
    const result = await query(
      `INSERT INTO goal_sub_tasks (user_goal_id, title, duration_minutes, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userGoalId, 'Test Sub-Task', 60, 0]
    );
    return result.rows[0].id;
  };

  // Cleanup helper
  const cleanupSubTasks = async (userGoalId: number) => {
    await query('DELETE FROM goal_sub_tasks WHERE user_goal_id = $1', [userGoalId]);
  };

  afterEach(async () => {
    // Clean up test data
    await query('DELETE FROM goal_sub_tasks WHERE title LIKE $1', ['Test%']);
    await query('DELETE FROM daily_sessions WHERE date = CURRENT_DATE AND user_id IN (SELECT id FROM users LIMIT 1)');
  });

  /**
   * Property 11: Foreign Key Integrity
   * For any attempt to create a sub-task with an invalid user_goal_id,
   * the database should reject the operation with a foreign key constraint error
   */
  test('Property 11a: Creating sub-task with invalid user_goal_id should fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }), // Invalid user_goal_id
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 480 }),
        async (invalidUserGoalId, title, duration) => {
          // Attempt to create sub-task with invalid user_goal_id
          await expect(
            query(
              `INSERT INTO goal_sub_tasks (user_goal_id, title, duration_minutes, display_order)
               VALUES ($1, $2, $3, 0)`,
              [invalidUserGoalId, title, duration]
            )
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11b: Creating session with invalid sub_task_id should fail
   * For any attempt to create a session with an invalid sub_task_id,
   * the database should reject the operation with a foreign key constraint error
   */
  test('Property 11b: Creating session with invalid sub_task_id should fail', async () => {
    const userGoalId = await createTestUserGoal();
    const userResult = await query('SELECT user_id, goal_id FROM user_goals WHERE id = $1', [userGoalId]);
    const { user_id, goal_id } = userResult.rows[0];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 999999, max: 9999999 }), // Invalid sub_task_id
          async (invalidSubTaskId) => {
            // Attempt to create session with invalid sub_task_id
            await expect(
              query(
                `INSERT INTO daily_sessions (user_id, goal_id, date, sub_task_id, status)
                 VALUES ($1, $2, CURRENT_DATE, $3, 'IN_PROGRESS')`,
                [user_id, goal_id, invalidSubTaskId]
              )
            ).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      await cleanupSubTasks(userGoalId);
    }
  });

  /**
   * Property 11c: Valid foreign keys should succeed
   * For any valid user_goal_id and sub_task_id, operations should succeed
   */
  test('Property 11c: Valid foreign keys should succeed', async () => {
    const userGoalId = await createTestUserGoal();

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 480 }),
          fc.integer({ min: 0, max: 10 }),
          async (title, duration, displayOrder) => {
            // Create sub-task with valid user_goal_id
            const result = await query(
              `INSERT INTO goal_sub_tasks (user_goal_id, title, duration_minutes, display_order)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [userGoalId, title, duration, displayOrder]
            );

            expect(result.rows.length).toBe(1);
            expect(result.rows[0].id).toBeDefined();

            // Clean up this specific sub-task
            await query('DELETE FROM goal_sub_tasks WHERE id = $1', [result.rows[0].id]);
          }
        ),
        { numRuns: 50 } // Fewer runs since we're creating actual data
      );
    } finally {
      await cleanupSubTasks(userGoalId);
    }
  });

  /**
   * Property 11d: Sessions with valid sub_task_id should succeed
   */
  test('Property 11d: Sessions with valid sub_task_id should succeed', async () => {
    const userGoalId = await createTestUserGoal();
    const subTaskId = await createTestSubTask(userGoalId);
    const userResult = await query('SELECT user_id, goal_id FROM user_goals WHERE id = $1', [userGoalId]);
    const { user_id, goal_id } = userResult.rows[0];

    try {
      // Create session with valid sub_task_id
      const result = await query(
        `INSERT INTO daily_sessions (user_id, goal_id, date, sub_task_id, status)
         VALUES ($1, $2, CURRENT_DATE, $3, 'IN_PROGRESS')
         ON CONFLICT (user_id, goal_id, date) DO UPDATE SET sub_task_id = $3
         RETURNING id`,
        [user_id, goal_id, subTaskId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBeDefined();
    } finally {
      await cleanupSubTasks(userGoalId);
    }
  });
});
