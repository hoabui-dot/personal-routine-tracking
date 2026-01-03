import { Router, Request, Response } from 'express';
import { cronJobs } from '../services/cronService';

const router = Router();

// Manual trigger for stopping paused sessions
router.post('/stop-paused-sessions', async (_req: Request, res: Response) => {
  try {
    console.log('[Cron Test] Manually triggering stopPausedSessions...');
    await cronJobs.stopPausedSessions();
    
    res.json({
      success: true,
      message: 'Paused sessions stopped successfully',
    });
  } catch (error) {
    console.error('[Cron Test] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop paused sessions',
    });
  }
});

// Manual trigger for calculating daily reports
router.post('/calculate-reports', async (_req: Request, res: Response) => {
  try {
    console.log('[Cron Test] Manually triggering calculateDailyReports...');
    await cronJobs.calculateDailyReports();
    
    res.json({
      success: true,
      message: 'Daily reports calculated successfully',
    });
  } catch (error) {
    console.error('[Cron Test] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate reports',
    });
  }
});

// Manual trigger for sending daily reminders
router.post('/send-reminders', async (_req: Request, res: Response) => {
  try {
    console.log('[Cron Test] Manually triggering sendDailyReminders...');
    await cronJobs.sendDailyReminders();
    
    res.json({
      success: true,
      message: 'Daily reminders sent successfully',
    });
  } catch (error) {
    console.error('[Cron Test] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminders',
    });
  }
});

// Trigger all cron jobs
router.post('/run-all', async (_req: Request, res: Response) => {
  try {
    console.log('[Cron Test] Manually triggering all cron jobs...');
    
    await cronJobs.stopPausedSessions();
    await cronJobs.calculateDailyReports();
    await cronJobs.sendDailyReminders();
    
    res.json({
      success: true,
      message: 'All cron jobs executed successfully',
    });
  } catch (error) {
    console.error('[Cron Test] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute cron jobs',
    });
  }
});

export default router;
