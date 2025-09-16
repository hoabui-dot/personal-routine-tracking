import { Router, Request, Response } from 'express';
import { query } from '../db';
import { CreateSessionRequest, StopSessionRequest } from '../types/Session';

const router = Router();

// Get all sessions for a specific sub-goal
router.get('/sub-goal/:subGoalId', async (req: Request, res: Response): Promise<void> => {
  try {
    const subGoalIdParam = req.params['subGoalId'];
    if (!subGoalIdParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const subGoalId = parseInt(subGoalIdParam);
    if (isNaN(subGoalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    const result = await query(
      'SELECT * FROM sessions WHERE sub_goal_id = $1 ORDER BY started_at DESC',
      [subGoalId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Get active session for a sub-goal (session without ended_at)
router.get('/sub-goal/:subGoalId/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const subGoalIdParam = req.params['subGoalId'];
    if (!subGoalIdParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const subGoalId = parseInt(subGoalIdParam);
    if (isNaN(subGoalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    const result = await query(
      'SELECT * FROM sessions WHERE sub_goal_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
      [subGoalId]
    );

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active session'
    });
  }
});

// Start a new session
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sub_goal_id }: CreateSessionRequest = req.body;

    if (!sub_goal_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: sub_goal_id'
      });
      return;
    }

    // Check if sub-goal exists
    const subGoalCheck = await query('SELECT id FROM sub_goals WHERE id = $1', [sub_goal_id]);
    if (subGoalCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sub-goal not found'
      });
      return;
    }

    // Check if there's already an active session for this sub-goal
    const activeSessionCheck = await query(
      'SELECT id FROM sessions WHERE sub_goal_id = $1 AND ended_at IS NULL',
      [sub_goal_id]
    );

    if (activeSessionCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: 'There is already an active session for this sub-goal'
      });
      return;
    }

    const result = await query(
      'INSERT INTO sessions (sub_goal_id, started_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
      [sub_goal_id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

// Stop a session
router.put('/:id/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    const id = parseInt(idParam);
    const { ended_at }: StopSessionRequest = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
      return;
    }

    // Check if session exists and is active
    const sessionCheck = await query(
      'SELECT * FROM sessions WHERE id = $1 AND ended_at IS NULL',
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
      return;
    }

    const endTime = ended_at || new Date().toISOString();

    // First get the session to calculate hours_spent manually
    const sessionResult = await query(
      'SELECT started_at FROM sessions WHERE id = $1 AND ended_at IS NULL',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
      return;
    }

    const startTime = new Date(sessionResult.rows[0].started_at);
    const endTimeDate = new Date(endTime);
    const durationMs = endTimeDate.getTime() - startTime.getTime();
    const hoursSpent = durationMs / (1000 * 60 * 60); // Convert to hours

    console.log('Stop Session Debug:', {
      sessionId: id,
      startTime: startTime.toISOString(),
      endTime: endTimeDate.toISOString(),
      durationMs,
      hoursSpent: hoursSpent.toFixed(6)
    });

    // Update session with ended_at and force hours_spent calculation
    const result = await query(
      `UPDATE sessions
       SET ended_at = $1,
           hours_spent = $2
       WHERE id = $3
       RETURNING *`,
      [endTime, hoursSpent.toFixed(6), id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop session'
    });
  }
});

// Get session statistics for a sub-goal
router.get('/sub-goal/:subGoalId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const subGoalIdParam = req.params['subGoalId'];
    if (!subGoalIdParam) {
      res.status(400).json({
        success: false,
        error: 'Sub-goal ID is required'
      });
      return;
    }

    const subGoalId = parseInt(subGoalIdParam);
    if (isNaN(subGoalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sub-goal ID'
      });
      return;
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(hours_spent), 0) as total_hours,
        COALESCE(AVG(hours_spent), 0) as avg_hours_per_session,
        sg.hours_expected,
        CASE 
          WHEN sg.hours_expected > 0 THEN 
            (COALESCE(SUM(s.hours_spent), 0) / sg.hours_expected * 100)
          ELSE 0 
        END as completion_percentage
      FROM sub_goals sg
      LEFT JOIN sessions s ON sg.id = s.sub_goal_id AND s.ended_at IS NOT NULL
      WHERE sg.id = $1
      GROUP BY sg.id, sg.hours_expected
    `, [subGoalId]);

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
    console.error('Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session statistics'
    });
  }
});

export default router;
