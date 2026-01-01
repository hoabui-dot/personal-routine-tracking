import { Router, Request, Response } from 'express';
import { query } from '../db';
import { UpdateUserGoalRequest } from '../types/Game';

const router = Router();

// GET /user-goals - Get all user goals with user and goal info
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        ug.id,
        ug.user_id,
        u.name as user_name,
        ug.goal_id,
        g.title as goal_title,
        ug.daily_duration_minutes,
        ROUND(ug.daily_duration_minutes / 60.0, 2) as daily_duration_hours
      FROM user_goals ug
      JOIN users u ON ug.user_id = u.id
      JOIN goals g ON ug.goal_id = g.id
      ORDER BY u.id
    `);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user goals',
    });
  }
});

// GET /user-goals/:userId/:goalId - Get specific user goal
router.get('/:userId/:goalId', async (req: Request, res: Response) => {
  try {
    const { userId, goalId } = req.params;
    
    const result = await query(`
      SELECT 
        ug.id,
        ug.user_id,
        u.name as user_name,
        ug.goal_id,
        g.title as goal_title,
        ug.daily_duration_minutes,
        ROUND(ug.daily_duration_minutes / 60.0, 2) as daily_duration_hours
      FROM user_goals ug
      JOIN users u ON ug.user_id = u.id
      JOIN goals g ON ug.goal_id = g.id
      WHERE ug.user_id = $1 AND ug.goal_id = $2
    `, [userId, goalId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User goal not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching user goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user goal',
    });
  }
});

// PUT /user-goals/:userId/:goalId - Update user goal duration
router.put('/:userId/:goalId', async (req: Request, res: Response) => {
  try {
    const { userId, goalId } = req.params;
    const { daily_duration_minutes }: UpdateUserGoalRequest = req.body;
    
    if (!daily_duration_minutes || daily_duration_minutes <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid duration. Must be greater than 0',
      });
      return;
    }
    
    const result = await query(`
      UPDATE user_goals 
      SET daily_duration_minutes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND goal_id = $3
      RETURNING *
    `, [daily_duration_minutes, userId, goalId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User goal not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User goal updated successfully',
    });
  } catch (error) {
    console.error('Error updating user goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user goal',
    });
  }
});

export default router;
