import { Router, Request, Response } from 'express';
import { query } from '../db';
import {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalResponse,
} from '../types/Goal';

const router = Router();

// Validation helper
const validateGoalData = (data: Partial<CreateGoalRequest>): string[] => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.year || typeof data.year !== 'number' || data.year < 2000 || data.year > 2100) {
    errors.push('Year is required and must be between 2000 and 2100');
  }

  return errors;
};

// Convert database row to response format
const formatGoalResponse = (goal: Goal): GoalResponse => ({
  id: goal.id,
  title: goal.title,
  year: goal.year,
  created_at: goal.created_at.toISOString(),
  updated_at: goal.updated_at.toISOString(),
});

// GET /goals - Get all goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    
    let queryText = 'SELECT * FROM goals';
    const queryParams: unknown[] = [];

    if (year) {
      queryText += ' WHERE year = $1';
      queryParams.push(parseInt(year as string));
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);
    const goals = result.rows.map(formatGoalResponse);

    res.json({
      success: true,
      data: goals,
      count: goals.length,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals',
    });
  }
});

// GET /goals/:id - Get a specific goal
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const goalId = parseInt(id || '');

    if (isNaN(goalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid goal ID',
      });
      return;
    }

    const result = await query('SELECT * FROM goals WHERE id = $1', [goalId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatGoalResponse(result.rows[0] as Goal),
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goal',
    });
  }
});

// POST /goals - Create a new goal
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const goalData: CreateGoalRequest = req.body;
    const errors = validateGoalData(goalData);

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    const result = await query(
      'INSERT INTO goals (title, year) VALUES ($1, $2) RETURNING *',
      [goalData.title.trim(), goalData.year]
    );

    res.status(201).json({
      success: true,
      data: formatGoalResponse(result.rows[0] as Goal),
      message: 'Goal created successfully',
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create goal',
    });
  }
});

// PUT /goals/:id - Update a goal
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const goalId = parseInt(id || '');
    const updateData: UpdateGoalRequest = req.body;

    if (isNaN(goalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid goal ID',
      });
      return;
    }

    // Check if goal exists
    const existingGoal = await query('SELECT * FROM goals WHERE id = $1', [goalId]);
    if (existingGoal.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
      return;
    }

    // Validate update data
    const errors: string[] = [];
    if (updateData.title !== undefined) {
      if (typeof updateData.title !== 'string' || updateData.title.trim().length === 0) {
        errors.push('Title must be a non-empty string');
      }
    }
    if (updateData.year !== undefined) {
      if (typeof updateData.year !== 'number' || updateData.year < 2000 || updateData.year > 2100) {
        errors.push('Year must be between 2000 and 2100');
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(updateData.title.trim());
      paramIndex++;
    }

    if (updateData.year !== undefined) {
      updateFields.push(`year = $${paramIndex}`);
      updateValues.push(updateData.year);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(goalId);

    const updateQuery = `
      UPDATE goals 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      data: formatGoalResponse(result.rows[0] as Goal),
      message: 'Goal updated successfully',
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goal',
    });
  }
});

// DELETE /goals/:id - Delete a goal
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const goalId = parseInt(id || '');

    if (isNaN(goalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid goal ID',
      });
      return;
    }

    const result = await query('DELETE FROM goals WHERE id = $1 RETURNING *', [goalId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatGoalResponse(result.rows[0] as Goal),
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete goal',
    });
  }
});

export default router;
