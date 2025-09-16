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
    const {
      goal_id,
      title,
      description,
      hours_expected,
      start_date,
      end_date,
      // Legacy support
      start_month,
      end_month
    }: CreateSubGoalRequest & { start_month?: number; end_month?: number } = req.body;

    // Validation
    if (!goal_id || !title || !hours_expected) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: goal_id, title, hours_expected'
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

    // Use new date format if provided, otherwise fall back to legacy month format
    let finalStartDate = start_date;
    let finalEndDate = end_date;
    let finalStartMonth = start_month || 1;
    let finalEndMonth = end_month || 12;

    if (start_date && end_date) {
      // Validate date format (DD/MM)
      const dateRegex = /^\d{2}\/\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        res.status(400).json({
          success: false,
          error: 'Date format must be DD/MM'
        });
        return;
      }
    } else if (start_month && end_month) {
      // Legacy month validation
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

      finalStartMonth = start_month;
      finalEndMonth = end_month;
      // Convert months to dates for new format
      finalStartDate = `01/${start_month.toString().padStart(2, '0')}`;
      finalEndDate = `31/${end_month.toString().padStart(2, '0')}`;
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
      `INSERT INTO sub_goals (goal_id, title, description, hours_expected, start_date, end_date, start_month, end_month)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [goal_id, title, description, hours_expected, finalStartDate, finalEndDate, finalStartMonth, finalEndMonth]
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
      description: updates.description ?? existing.description,
      hours_expected: updates.hours_expected ?? existing.hours_expected,
      start_date: updates.start_date ?? existing.start_date,
      end_date: updates.end_date ?? existing.end_date,
      // Legacy fields for backward compatibility
      start_month: existing.start_month,
      end_month: existing.end_month,
    };

    // Validation
    if (updatedData.hours_expected <= 0) {
      res.status(400).json({
        success: false,
        error: 'Hours expected must be greater than 0'
      });
      return;
    }

    // Validate date format if provided
    if (updatedData.start_date || updatedData.end_date) {
      const dateRegex = /^\d{2}\/\d{2}$/;
      if (updatedData.start_date && !dateRegex.test(updatedData.start_date)) {
        res.status(400).json({
          success: false,
          error: 'Start date format must be DD/MM'
        });
        return;
      }
      if (updatedData.end_date && !dateRegex.test(updatedData.end_date)) {
        res.status(400).json({
          success: false,
          error: 'End date format must be DD/MM'
        });
        return;
      }
    }

    const result = await query(
      `UPDATE sub_goals
       SET title = $1, description = $2, hours_expected = $3, start_date = $4, end_date = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [updatedData.title, updatedData.description, updatedData.hours_expected, updatedData.start_date, updatedData.end_date, id]
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
