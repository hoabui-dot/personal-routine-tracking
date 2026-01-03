import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /goal-sub-tasks - Get all sub-tasks for a user goal
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userGoalId } = req.query;
    
    let queryText = `
      SELECT 
        gst.id,
        gst.user_goal_id,
        gst.title,
        gst.duration_minutes,
        gst.display_order,
        gst.created_at,
        gst.updated_at
      FROM goal_sub_tasks gst
    `;
    
    const params: any[] = [];
    
    if (userGoalId) {
      queryText += ' WHERE gst.user_goal_id = $1';
      params.push(userGoalId);
    }
    
    queryText += ' ORDER BY gst.user_goal_id, gst.display_order';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching goal sub-tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goal sub-tasks',
    });
  }
});

// POST /goal-sub-tasks - Create a new sub-task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_goal_id, title, duration_minutes, display_order } = req.body;
    
    if (!user_goal_id || !title || !duration_minutes) {
      res.status(400).json({
        success: false,
        error: 'user_goal_id, title, and duration_minutes are required',
      });
      return;
    }
    
    // Validate that total sub-tasks duration doesn't exceed goal duration
    const userGoalResult = await query(
      'SELECT daily_duration_minutes FROM user_goals WHERE id = $1',
      [user_goal_id]
    );
    
    if (userGoalResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User goal not found',
      });
      return;
    }
    
    const goalDuration = userGoalResult.rows[0].daily_duration_minutes;
    
    // Get current total of sub-tasks
    const subTasksResult = await query(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM goal_sub_tasks WHERE user_goal_id = $1',
      [user_goal_id]
    );
    
    const currentTotal = parseInt(subTasksResult.rows[0].total);
    const newTotal = currentTotal + duration_minutes;
    
    if (newTotal > goalDuration) {
      res.status(400).json({
        success: false,
        error: `Total sub-tasks duration (${newTotal} minutes) would exceed goal duration (${goalDuration} minutes)`,
      });
      return;
    }
    
    // Get next display order if not provided
    let order = display_order;
    if (order === undefined) {
      const orderResult = await query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM goal_sub_tasks WHERE user_goal_id = $1',
        [user_goal_id]
      );
      order = orderResult.rows[0].next_order;
    }
    
    const result = await query(
      `INSERT INTO goal_sub_tasks (user_goal_id, title, duration_minutes, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_goal_id, title, duration_minutes, order]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Sub-task created successfully',
    });
  } catch (error) {
    console.error('Error creating goal sub-task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create goal sub-task',
    });
  }
});

// PUT /goal-sub-tasks/:id - Update a sub-task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, duration_minutes, display_order } = req.body;
    
    // Get current sub-task
    const currentResult = await query(
      'SELECT * FROM goal_sub_tasks WHERE id = $1',
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sub-task not found',
      });
      return;
    }
    
    const currentSubTask = currentResult.rows[0];
    const newDuration = duration_minutes !== undefined ? duration_minutes : currentSubTask.duration_minutes;
    
    // Validate total duration if duration is being changed
    if (duration_minutes !== undefined && duration_minutes !== currentSubTask.duration_minutes) {
      const userGoalResult = await query(
        'SELECT daily_duration_minutes FROM user_goals WHERE id = $1',
        [currentSubTask.user_goal_id]
      );
      
      const goalDuration = userGoalResult.rows[0].daily_duration_minutes;
      
      // Get current total excluding this sub-task
      const subTasksResult = await query(
        'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM goal_sub_tasks WHERE user_goal_id = $1 AND id != $2',
        [currentSubTask.user_goal_id, id]
      );
      
      const currentTotal = parseInt(subTasksResult.rows[0].total);
      const newTotal = currentTotal + newDuration;
      
      if (newTotal > goalDuration) {
        res.status(400).json({
          success: false,
          error: `Total sub-tasks duration (${newTotal} minutes) would exceed goal duration (${goalDuration} minutes)`,
        });
        return;
      }
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }
    
    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramIndex}`);
      values.push(duration_minutes);
      paramIndex++;
    }
    
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(display_order);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
      return;
    }
    
    values.push(id);
    const result = await query(
      `UPDATE goal_sub_tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Sub-task updated successfully',
    });
  } catch (error) {
    console.error('Error updating goal sub-task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goal sub-task',
    });
  }
});

// DELETE /goal-sub-tasks/:id - Delete a sub-task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`[DELETE] Attempting to delete sub-task with id: ${id}`);
    
    // First check if the sub-task exists
    const checkResult = await query(
      'SELECT * FROM goal_sub_tasks WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`[DELETE] Sub-task ${id} not found`);
      res.status(404).json({
        success: false,
        error: 'Sub-task not found',
      });
      return;
    }
    
    const subTask = checkResult.rows[0];
    console.log(`[DELETE] Found sub-task:`, subTask);
    
    // Check if there are any sessions using this sub-task
    const sessionsResult = await query(
      'SELECT COUNT(*) as count FROM daily_sessions WHERE sub_task_id = $1',
      [id]
    );
    
    const sessionCount = parseInt(sessionsResult.rows[0].count);
    console.log(`[DELETE] Found ${sessionCount} session(s) using this sub-task`);
    
    // Delete the sub-task (CASCADE will handle related sessions)
    const result = await query(
      'DELETE FROM goal_sub_tasks WHERE id = $1 RETURNING *',
      [id]
    );
    
    console.log(`[DELETE] Successfully deleted sub-task ${id}`);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: sessionCount > 0 
        ? `Sub-task deleted successfully (${sessionCount} related session(s) also removed)`
        : 'Sub-task deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE] Error deleting goal sub-task:', error);
    console.error('[DELETE] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete goal sub-task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
