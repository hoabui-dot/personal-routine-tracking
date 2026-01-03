import cron, { ScheduledTask } from 'node-cron';
import { query } from '../db';
import { sendEmail } from '../utils/email';
import { env } from '../env';

interface CronConfig {
  id: number;
  job_name: string;
  cron_expression: string;
  enabled: boolean;
  description: string;
  last_run: Date | null;
  next_run: Date | null;
}

const activeCronTasks: Map<string, ScheduledTask> = new Map();

async function getCronConfig(jobName: string): Promise<CronConfig | null> {
  try {
    const result = await query('SELECT * FROM cron_config WHERE job_name = $1', [jobName]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`[Cron] Error fetching config for ${jobName}:`, error);
    return null;
  }
}

async function getAllCronConfigs(): Promise<CronConfig[]> {
  try {
    const result = await query('SELECT * FROM cron_config ORDER BY job_name');
    return result.rows;
  } catch (error) {
    console.error('[Cron] Error fetching all configs:', error);
    return [];
  }
}

async function updateLastRun(jobName: string): Promise<void> {
  try {
    await query(
      'UPDATE cron_config SET last_run = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_name = $1',
      [jobName]
    );
  } catch (error) {
    console.error(`[Cron] Error updating last_run for ${jobName}:`, error);
  }
}

async function stopPausedSessions() {
  const jobName = 'stop_paused_sessions';
  try {
    console.log('[Cron] Starting stopPausedSessions job...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const sessionsResult = await query(`
      SELECT 
        ds.id, ds.user_id, ds.goal_id, ds.date, ds.duration_completed_minutes, ds.status,
        ug.daily_duration_minutes as target_minutes, u.name as user_name, g.title as goal_title
      FROM daily_sessions ds
      JOIN user_goals ug ON ds.user_id = ug.user_id AND ds.goal_id = ug.goal_id
      JOIN users u ON ds.user_id = u.id
      JOIN goals g ON ds.goal_id = g.id
      WHERE ds.date = $1 AND ds.status IN ('PAUSED', 'IN_PROGRESS')
    `, [yesterdayStr]);
    
    console.log(`[Cron] Found ${sessionsResult.rows.length} paused/in-progress sessions from ${yesterdayStr}`);
    
    for (const session of sessionsResult.rows) {
      const isCompleted = session.duration_completed_minutes >= session.target_minutes;
      const newStatus = isCompleted ? 'DONE' : 'MISSED';
      
      await query(`
        UPDATE daily_sessions
        SET status = $1, finished_at = CURRENT_TIMESTAMP, paused_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newStatus, session.id]);
      
      console.log(`[Cron] Session ${session.id} (${session.user_name} - ${session.goal_title}): ${session.status} → ${newStatus}`);
    }
    
    await updateLastRun(jobName);
    console.log('[Cron] stopPausedSessions job completed');
  } catch (error) {
    console.error('[Cron] Error in stopPausedSessions:', error);
  }
}

async function calculateDailyReports() {
  const jobName = 'calculate_daily_reports';
  try {
    console.log('[Cron] Starting calculateDailyReports job...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const userGoalsResult = await query(`
      SELECT ug.user_id, ug.goal_id, u.name as user_name, u.email, g.title as goal_title
      FROM user_goals ug
      JOIN users u ON ug.user_id = u.id
      JOIN goals g ON ug.goal_id = g.id
    `);
    
    console.log(`[Cron] Checking ${userGoalsResult.rows.length} user-goal combinations for ${yesterdayStr}`);
    
    for (const userGoal of userGoalsResult.rows) {
      const sessionResult = await query(`
        SELECT id, status FROM daily_sessions
        WHERE user_id = $1 AND goal_id = $2 AND date = $3
      `, [userGoal.user_id, userGoal.goal_id, yesterdayStr]);
      
      if (sessionResult.rows.length === 0) {
        await query(`
          INSERT INTO daily_sessions (user_id, goal_id, date, status, duration_completed_minutes)
          VALUES ($1, $2, $3, 'MISSED', 0)
        `, [userGoal.user_id, userGoal.goal_id, yesterdayStr]);
        
        console.log(`[Cron] Created MISSED session for ${userGoal.user_name} - ${userGoal.goal_title} on ${yesterdayStr}`);
      }
    }
    
    await updateLastRun(jobName);
    console.log('[Cron] calculateDailyReports job completed');
  } catch (error) {
    console.error('[Cron] Error in calculateDailyReports:', error);
  }
}

async function sendDailyReminders() {
  const jobName = 'send_daily_reminders';
  try {
    console.log('[Cron] Starting sendDailyReminders job...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const usersResult = await query(`
      SELECT DISTINCT u.id, u.name, u.email, u.email_verified
      FROM users u
      JOIN user_goals ug ON u.id = ug.user_id
      WHERE u.email IS NOT NULL AND u.email_verified = true
      ORDER BY u.id
    `);
    
    console.log(`[Cron] Sending reminders to ${usersResult.rows.length} users`);
    
    for (const user of usersResult.rows) {
      const goalsResult = await query(`
        SELECT 
          g.title, ug.daily_duration_minutes,
          COALESCE(ds.status, 'NOT_STARTED') as status,
          COALESCE(ds.duration_completed_minutes, 0) as completed_minutes
        FROM user_goals ug
        JOIN goals g ON ug.goal_id = g.id
        LEFT JOIN daily_sessions ds ON ds.user_id = ug.user_id AND ds.goal_id = ug.goal_id AND ds.date = $1
        WHERE ug.user_id = $2
        ORDER BY g.title
      `, [today, user.id]);
      
      const goals = goalsResult.rows;
      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.status === 'DONE').length;
      const inProgressGoals = goals.filter(g => g.status === 'IN_PROGRESS' || g.status === 'PAUSED').length;
      
      const emailHtml = generateReminderEmail(user.name, goals, completedGoals, totalGoals, inProgressGoals);
      
      try {
        await sendEmail({
          to: user.email,
          subject: `🎯 Daily Mission Reminder - ${today}`,
          html: emailHtml,
        });
        
        console.log(`[Cron] Reminder email sent to ${user.name} (${user.email})`);
      } catch (emailError) {
        console.error(`[Cron] Failed to send email to ${user.email}:`, emailError);
      }
    }
    
    await updateLastRun(jobName);
    console.log('[Cron] sendDailyReminders job completed');
  } catch (error) {
    console.error('[Cron] Error in sendDailyReminders:', error);
  }
}

function generateReminderEmail(userName: string, goals: any[], completedGoals: number, totalGoals: number, inProgressGoals: number): string {
  const goalsHtml = goals.map(goal => {
    const statusEmoji = goal.status === 'DONE' ? '✅' : goal.status === 'IN_PROGRESS' || goal.status === 'PAUSED' ? '⏳' : '⭕';
    const progressPercent = Math.round((goal.completed_minutes / goal.daily_duration_minutes) * 100);
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${statusEmoji}</span>
            <span style="font-weight: 600; color: #1f2937;">${goal.title}</span>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: #6b7280;">${goal.completed_minutes} / ${goal.daily_duration_minutes} min</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <div style="background: #f3f4f6; border-radius: 9999px; height: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); height: 100%; width: ${progressPercent}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daily Mission Reminder</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 24px 24px 0 0; padding: 40px 30px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      <div style="font-size: 80px; margin-bottom: 20px;">🦫</div>
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Good Morning, ${userName}!</h1>
      <p style="margin: 16px 0 0 0; font-size: 18px; color: #6b7280;">Time to conquer your daily missions! 🎯</p>
    </div>
    <div style="background: white; padding: 30px; border-top: 3px solid #f3f4f6;">
      <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 30px;">
        <div><div style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${completedGoals}</div><div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Completed</div></div>
        <div><div style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${inProgressGoals}</div><div style="font-size: 14px; color: #6b7280; margin-top: 4px;">In Progress</div></div>
        <div><div style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${totalGoals}</div><div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Total Goals</div></div>
      </div>
      <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0;">📋 Today's Missions</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead><tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Goal</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Progress</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Status</th>
        </tr></thead>
        <tbody>${goalsHtml}</tbody>
      </table>
    </div>
    <div style="background: white; padding: 30px; text-align: center; border-top: 3px solid #f3f4f6;">
      <a href="${env.FRONTEND_URL}/calendar" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">🚀 Start Your Day</a>
    </div>
    <div style="background: white; border-radius: 0 0 24px 24px; padding: 30px; text-align: center; border-top: 3px solid #f3f4f6; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">💪 Stay consistent, stay awesome!</p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">You're receiving this because you're part of the Daily Goals Game</p>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <div style="font-size: 40px; margin-bottom: 10px;">🦫</div>
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">Powered by Capybara Productivity</p>
    </div>
  </div>
</body>
</html>`;
}

function scheduleCronJob(jobName: string, cronExpression: string, jobFunction: () => Promise<void>): void {
  if (activeCronTasks.has(jobName)) {
    activeCronTasks.get(jobName)?.stop();
    activeCronTasks.delete(jobName);
  }
  
  if (!cron.validate(cronExpression)) {
    console.error(`[Cron] Invalid cron expression for ${jobName}: ${cronExpression}`);
    return;
  }
  
  const task = cron.schedule(cronExpression, jobFunction, {
    timezone: env.TZ || 'Asia/Ho_Chi_Minh'
  });
  
  activeCronTasks.set(jobName, task);
  console.log(`[Cron] Scheduled ${jobName} with expression: ${cronExpression}`);
}

export async function initializeCronJobs() {
  console.log('[Cron] Initializing cron jobs from database...');
  
  const configs = await getAllCronConfigs();
  
  for (const config of configs) {
    if (!config.enabled) {
      console.log(`[Cron] Skipping disabled job: ${config.job_name}`);
      continue;
    }
    
    switch (config.job_name) {
      case 'stop_paused_sessions':
        scheduleCronJob(config.job_name, config.cron_expression, stopPausedSessions);
        break;
      case 'calculate_daily_reports':
        scheduleCronJob(config.job_name, config.cron_expression, calculateDailyReports);
        break;
      case 'send_daily_reminders':
        scheduleCronJob(config.job_name, config.cron_expression, sendDailyReminders);
        break;
      default:
        console.warn(`[Cron] Unknown job name: ${config.job_name}`);
    }
  }
  
  console.log(`[Cron] Initialized ${activeCronTasks.size} cron jobs`);
  console.log(`[Cron] Timezone: ${env.TZ || 'Asia/Ho_Chi_Minh'}`);
}

export async function reloadCronJobs() {
  console.log('[Cron] Reloading cron jobs...');
  
  for (const [jobName, task] of activeCronTasks.entries()) {
    task.stop();
    console.log(`[Cron] Stopped ${jobName}`);
  }
  activeCronTasks.clear();
  
  await initializeCronJobs();
}

export const cronJobs = {
  stopPausedSessions,
  calculateDailyReports,
  sendDailyReminders,
  getAllCronConfigs,
  getCronConfig,
  reloadCronJobs,
};
