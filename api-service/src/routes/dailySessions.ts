import { Router, Request, Response } from 'express';
import { query } from '../db';
import { StartSessionRequest, StopSessionRequest } from '../types/Game';

const router = Router();

// GET /daily-sessions - Get sessions with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, goalId, startDate, endDate, date } = req.query;
    
    let queryText = `
      SELECT 
        ds.id,
        ds.user_id,
        ds.goal_id,
        ds.date::text as date,
        ds.started_at,
        ds.finished_at,
        ds.paused_at,
        ds.total_paused_seconds,
        ds.duration_completed_minutes,
        ds.status,
        ds.created_at,
        ds.updated_at,
        u.name as user_name
      FROM daily_sessions ds
      JOIN users u ON ds.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND ds.user_id = $` + paramIndex;
      params.push(userId);
      paramIndex++;
    }
    
    if (goalId) {
      queryText += ` AND ds.goal_id = $` + paramIndex;
      params.push(goalId);
      paramIndex++;
    }
    
    if (date) {
      queryText += ` AND ds.date = $` + paramIndex;
      params.push(date);
      paramIndex++;
    } else if (startDate && endDate) {
      queryText += ` AND ds.date >= $` + paramIndex + ` AND ds.date <= $` + (paramIndex + 1);
      params.push(startDate, endDate);
      paramIndex += 2;
    }
    
    queryText += ' ORDER BY ds.date DESC, ds.user_id';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

// GET /daily-sessions/summary - Get game summary for all users
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { goalId } = req.query;
    
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        COUNT(CASE WHEN ds.status = 'DONE' THEN 1 END) as total_done,
        COUNT(CASE WHEN ds.status = 'MISSED' THEN 1 END) as total_missed
      FROM users u
      LEFT JOIN daily_sessions ds ON u.id = ds.user_id ${goalId ? 'AND ds.goal_id = $1' : ''}
      GROUP BY u.id, u.name
      ORDER BY u.id
    `, goalId ? [goalId] : []);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
    });
  }
});

// POST /daily-sessions/start - Start a session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { user_id, goal_id, date, sub_task_id }: StartSessionRequest & { sub_task_id?: number } = req.body;
    
    if (!user_id || !goal_id || !date) {
      res.status(400).json({
        success: false,
        error: 'user_id, goal_id, and date are required',
      });
      return;
    }
    
    // Check if session already exists for this date
    const existing = await query(
      'SELECT * FROM daily_sessions WHERE user_id = $1 AND goal_id = $2 AND date = $3',
      [user_id, goal_id, date]
    );
    
    if (existing.rows.length > 0) {
      const session = existing.rows[0];
      
      // If already DONE or IN_PROGRESS, return existing
      if (session.status === 'DONE' || session.status === 'IN_PROGRESS') {
        res.json({
          success: true,
          data: session,
          message: 'Session already exists',
        });
        return;
      }
    }
    
    // Create or update session
    const result = await query(`
      INSERT INTO daily_sessions (user_id, goal_id, date, started_at, status, sub_task_id)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'IN_PROGRESS', $4)
      ON CONFLICT (user_id, goal_id, date)
      DO UPDATE SET 
        started_at = CURRENT_TIMESTAMP,
        status = 'IN_PROGRESS',
        sub_task_id = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [user_id, goal_id, date, sub_task_id || null]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Session started successfully',
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
    });
  }
});

// POST /daily-sessions/stop - Stop a session
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const { session_id }: StopSessionRequest = req.body;
    
    if (!session_id) {
      res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
      return;
    }
    
    // Get session and user goal
    const sessionResult = await query(
      'SELECT * FROM daily_sessions WHERE id = $1',
      [session_id]
    );
    
    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }
    
    const session = sessionResult.rows[0];
    
    // Get required duration
    const goalResult = await query(
      'SELECT daily_duration_minutes FROM user_goals WHERE user_id = $1 AND goal_id = $2',
      [session.user_id, session.goal_id]
    );
    
    if (goalResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User goal not found',
      });
      return;
    }
    
    const requiredMinutes = goalResult.rows[0].daily_duration_minutes;
    
    // Calculate actual active duration (excluding paused time)
    const startedAt = new Date(session.started_at);
    const now = new Date();
    const totalElapsedMs = now.getTime() - startedAt.getTime();
    const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);
    const pausedSeconds = session.total_paused_seconds || 0;
    const activeElapsedSeconds = totalElapsedSeconds - pausedSeconds;
    const activeElapsedMinutes = Math.floor(activeElapsedSeconds / 60);
    
    console.log('Stop session calculation:', {
      session_id,
      requiredMinutes,
      activeElapsedMinutes,
      totalElapsedSeconds,
      pausedSeconds,
      activeElapsedSeconds
    });
    
    // Determine status based on active elapsed time
    // DONE if completed required time, MISSED if stopped early
    const status = activeElapsedMinutes >= requiredMinutes ? 'DONE' : 'MISSED';
    
    console.log('Setting status to:', status);
    
    // Update session
    const result = await query(`
      UPDATE daily_sessions 
      SET 
        finished_at = CURRENT_TIMESTAMP,
        duration_completed_minutes = $1,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [activeElapsedMinutes, status, session_id]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: status === 'DONE' ? 'Session completed! ✅' : 'Session stopped early - marked as MISSED ❌',
    });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop session',
    });
  }
});

// POST /daily-sessions/complete - Auto-complete session (when timer reaches 0)
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
      return;
    }
    
    // Get session
    const sessionResult = await query(
      'SELECT * FROM daily_sessions WHERE id = $1',
      [session_id]
    );
    
    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }
    
    const session = sessionResult.rows[0];
    
    // Get required duration
    const goalResult = await query(
      'SELECT daily_duration_minutes FROM user_goals WHERE user_id = $1 AND goal_id = $2',
      [session.user_id, session.goal_id]
    );
    
    const requiredMinutes = goalResult.rows[0].daily_duration_minutes;
    
    // Mark as DONE
    const result = await query(`
      UPDATE daily_sessions 
      SET 
        finished_at = CURRENT_TIMESTAMP,
        duration_completed_minutes = $1,
        status = 'DONE',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [requiredMinutes, session_id]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Session completed automatically!',
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session',
    });
  }
});

// POST /daily-sessions/pause - Pause a session
router.post('/pause', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
      return;
    }
    
    // Get session
    const sessionResult = await query(
      'SELECT * FROM daily_sessions WHERE id = $1',
      [session_id]
    );
    
    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }
    
    const session = sessionResult.rows[0];
    
    if (session.status !== 'IN_PROGRESS') {
      res.status(400).json({
        success: false,
        error: 'Can only pause sessions that are in progress',
      });
      return;
    }
    
    // Pause the session
    const result = await query(`
      UPDATE daily_sessions 
      SET 
        paused_at = CURRENT_TIMESTAMP,
        status = 'PAUSED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [session_id]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Session paused',
    });
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause session',
    });
  }
});

// POST /daily-sessions/resume - Resume a paused session
router.post('/resume', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
      return;
    }
    
    // Get session
    const sessionResult = await query(
      'SELECT * FROM daily_sessions WHERE id = $1',
      [session_id]
    );
    
    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }
    
    const session = sessionResult.rows[0];
    
    if (session.status !== 'PAUSED') {
      res.status(400).json({
        success: false,
        error: 'Can only resume paused sessions',
      });
      return;
    }
    
    // Calculate paused duration
    const pausedAt = new Date(session.paused_at);
    const now = new Date();
    const pausedSeconds = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
    const totalPausedSeconds = (session.total_paused_seconds || 0) + pausedSeconds;
    
    // Resume the session
    const result = await query(`
      UPDATE daily_sessions 
      SET 
        paused_at = NULL,
        total_paused_seconds = $1,
        status = 'IN_PROGRESS',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [totalPausedSeconds, session_id]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Session resumed',
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume session',
    });
  }
});

// POST /daily-sessions/check-and-cleanup - Check for stale sessions and auto-pause today's sessions
router.post('/check-and-cleanup', async (_, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all IN_PROGRESS or PAUSED sessions from previous days
    const staleResult = await query(`
      SELECT * FROM daily_sessions 
      WHERE status IN ('IN_PROGRESS', 'PAUSED') 
      AND date < $1
    `, [today]);
    
    const staleSessions = staleResult.rows;
    
    // Mark them as MISSED
    if (staleSessions.length > 0) {
      await query(`
        UPDATE daily_sessions 
        SET 
          status = 'MISSED',
          finished_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('IN_PROGRESS', 'PAUSED') 
        AND date < $1
      `, [today]);
    }
    
    // Auto-pause all IN_PROGRESS sessions for today (on page refresh)
    const todayInProgressResult = await query(`
      SELECT * FROM daily_sessions 
      WHERE date = $1 
      AND status = 'IN_PROGRESS'
    `, [today]);
    
    const todayInProgress = todayInProgressResult.rows;
    
    if (todayInProgress.length > 0) {
      await query(`
        UPDATE daily_sessions 
        SET 
          status = 'PAUSED',
          paused_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = $1 
        AND status = 'IN_PROGRESS'
      `, [today]);
    }
    
    // Get today's sessions (now all should be PAUSED or DONE)
    const todayResult = await query(`
      SELECT 
        ds.id,
        ds.user_id,
        ds.goal_id,
        ds.date::text as date,
        ds.started_at,
        ds.finished_at,
        ds.paused_at,
        ds.total_paused_seconds,
        ds.duration_completed_minutes,
        ds.status,
        ds.created_at,
        ds.updated_at,
        u.name as user_name
      FROM daily_sessions ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.date = $1 
      AND ds.status IN ('PAUSED', 'DONE')
    `, [today]);
    
    res.json({
      success: true,
      data: {
        cleanedUp: staleSessions.length,
        autoPaused: todayInProgress.length,
        sessions: todayResult.rows,
      },
      message: staleSessions.length > 0 
        ? `Marked ${staleSessions.length} old session(s) as MISSED${todayInProgress.length > 0 ? ` and auto-paused ${todayInProgress.length} session(s)` : ''}` 
        : todayInProgress.length > 0 
          ? `Auto-paused ${todayInProgress.length} session(s)`
          : 'No stale sessions found',
    });
  } catch (error) {
    console.error('Error checking sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check sessions',
    });
  }
});

export default router;
