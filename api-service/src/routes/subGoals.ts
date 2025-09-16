import { Router, Request, Response } from 'express';
import { query } from '../db';
import { CreateSubGoalRequest, UpdateSubGoalRequest } from '../types/SubGoal';

const router = Router();

// Get all sub-goals for a specific goal
router.get('/goal/:goalId', async (req: Request, res: Response): Promise<void> => {
  try {
    const goalIdParam = req.params['goalId'];
    if (!goalIdParam) {
      res.status(400).json({
        success: false,
        error: 'Goal ID is required'
      });
      return;
    }

    const goalId = parseInt(goalIdParam);
    if (isNaN(goalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid goal ID'
      });
      return;
    }

    const result = await query(
      'SELECT * FROM sub_goals WHERE goal_id = $1 ORDER BY start_month, created_at',
      [goalId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching sub-goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sub-goals'
    });
  }
});

// Get specific sub-goal
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const id = parseInt(idParam);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    const result = await query('SELECT * FROM sub_goals WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sub-goal not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching sub-goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sub-goal'
    });
  }
});

// Create new sub-goal
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { goal_id, title, hours_expected, start_month, end_month }: CreateSubGoalRequest = req.body;

    // Validation
    if (!goal_id || !title || !hours_expected || !start_month || !end_month) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: goal_id, title, hours_expected, start_month, end_month'
      });
      return;
    }

    if (hours_expected <= 0) {
      res.status(400).json({
        success: false,
        error: 'Hours expected must be greater than 0'
      });
      return;
    }

    if (start_month < 1 || start_month > 12 || end_month < 1 || end_month > 12) {
      res.status(400).json({
        success: false,
        error: 'Months must be between 1 and 12'
      });
      return;
    }

    if (start_month > end_month) {
      res.status(400).json({
        success: false,
        error: 'Start month cannot be after end month'
      });
      return;
    }

    // Check if goal exists
    const goalCheck = await query('SELECT id FROM goals WHERE id = $1', [goal_id]);
    if (goalCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
      return;
    }

    const result = await query(
      `INSERT INTO sub_goals (goal_id, title, hours_expected, start_month, end_month) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [goal_id, title, hours_expected, start_month, end_month]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating sub-goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sub-goal'
    });
  }
});

// Update sub-goal
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const id = parseInt(idParam);
    const updates: UpdateSubGoalRequest = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    // Check if sub-goal exists
    const existingResult = await query('SELECT * FROM sub_goals WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sub-goal not found'
      });
      return;
    }

    const existing = existingResult.rows[0];
    const updatedData = {
      title: updates.title ?? existing.title,
      hours_expected: updates.hours_expected ?? existing.hours_expected,
      start_month: updates.start_month ?? existing.start_month,
      end_month: updates.end_month ?? existing.end_month,
    };

    // Validation
    if (updatedData.hours_expected <= 0) {
      res.status(400).json({
        success: false,
        error: 'Hours expected must be greater than 0'
      });
      return;
    }

    if (updatedData.start_month < 1 || updatedData.start_month > 12 || 
        updatedData.end_month < 1 || updatedData.end_month > 12) {
      res.status(400).json({
        success: false,
        error: 'Months must be between 1 and 12'
      });
      return;
    }

    if (updatedData.start_month > updatedData.end_month) {
      res.status(400).json({
        success: false,
        error: 'Start month cannot be after end month'
      });
      return;
    }

    const result = await query(
      `UPDATE sub_goals 
       SET title = $1, hours_expected = $2, start_month = $3, end_month = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [updatedData.title, updatedData.hours_expected, updatedData.start_month, updatedData.end_month, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating sub-goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sub-goal'
    });
  }
});

// Delete sub-goal
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const id = parseInt(idParam);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    const result = await query('DELETE FROM sub_goals WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sub-goal not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Sub-goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sub-goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sub-goal'
    });
  }
});

export default router;
