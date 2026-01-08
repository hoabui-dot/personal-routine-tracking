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
    const progressColor = progressPercent >= 100 ? '#10b981' : progressPercent >= 50 ? '#f59e0b' : '#8D6E63';
    
    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #EFEBE9; vertical-align: middle;">
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 0; width: 32px; vertical-align: middle;">
                <span style="font-size: 24px; display: inline-block; line-height: 1;">${statusEmoji}</span>
              </td>
              <td style="padding: 0 0 0 8px; vertical-align: middle;">
                <span style="font-weight: 600; color: #3E2723; font-size: 15px; line-height: 1.4; display: inline-block;">${goal.title}</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #EFEBE9; text-align: center; vertical-align: middle; white-space: nowrap;">
          <span style="color: #6D4C41; font-weight: 500; font-size: 14px;">${goal.completed_minutes} / ${goal.daily_duration_minutes} min</span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #EFEBE9; text-align: center; vertical-align: middle;">
          <div style="background: #EFEBE9; border-radius: 9999px; height: 10px; overflow: hidden; width: 100px; margin: 0 auto;">
            <div style="background: ${progressColor}; height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  const motivationalMessages = [
    "Every small step counts! 🌟",
    "You've got this! 💪",
    "Stay calm and focused! 🧘",
    "Progress over perfection! ✨",
    "One goal at a time! 🎯"
  ];
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Mission Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%); border-radius: 20px 20px 0 0; padding: 40px 30px; text-align: center; box-shadow: 0 10px 25px rgba(141, 110, 99, 0.2); position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);"></div>
      <div style="position: relative; z-index: 1;">
        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 15px;">
          <ellipse cx="40" cy="48" rx="28" ry="22" fill="white" opacity="0.95"/>
          <ellipse cx="40" cy="28" rx="20" ry="18" fill="white"/>
          <ellipse cx="28" cy="18" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="52" cy="18" rx="5" ry="8" fill="white" opacity="0.9"/>
          <circle cx="33" cy="26" r="3" fill="#3E2723"/>
          <circle cx="47" cy="26" r="3" fill="#3E2723"/>
          <circle cx="33.5" cy="25" r="1.2" fill="white" opacity="0.9"/>
          <circle cx="47.5" cy="25" r="1.2" fill="white" opacity="0.9"/>
          <ellipse cx="40" cy="33" rx="4" ry="2.5" fill="#6D4C41"/>
          <path d="M 35 35 Q 40 38 45 35" stroke="#6D4C41" stroke-width="2" stroke-linecap="round" fill="none"/>
          <ellipse cx="28" cy="65" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="40" cy="68" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="52" cy="65" rx="5" ry="8" fill="white" opacity="0.9"/>
        </svg>
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Good Morning, ${userName}! ☀️</h1>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95);">Time to conquer your daily missions! 🎯</p>
      </div>
    </div>
    
    <!-- Stats Section -->
    <div style="background: white; padding: 30px 20px; border-top: 3px solid #EFEBE9;">
      <table style="width: 100%; max-width: 500px; margin: 0 auto 30px; border-collapse: separate; border-spacing: 15px 0;">
        <tr>
          <td style="text-align: center; vertical-align: top; padding: 0;">
            <div style="width: 80px; height: 80px; margin: 0 auto 12px; background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
              <span style="font-size: 36px; font-weight: 700; color: #2E7D32; line-height: 1;">${completedGoals}</span>
            </div>
            <div style="font-size: 13px; color: #6D4C41; font-weight: 600; line-height: 1.3;">✅ Completed</div>
          </td>
          <td style="text-align: center; vertical-align: top; padding: 0;">
            <div style="width: 80px; height: 80px; margin: 0 auto 12px; background: linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);">
              <span style="font-size: 36px; font-weight: 700; color: #E65100; line-height: 1;">${inProgressGoals}</span>
            </div>
            <div style="font-size: 13px; color: #6D4C41; font-weight: 600; line-height: 1.3;">⏳ In Progress</div>
          </td>
          <td style="text-align: center; vertical-align: top; padding: 0;">
            <div style="width: 80px; height: 80px; margin: 0 auto 12px; background: linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(141, 110, 99, 0.2);">
              <span style="font-size: 36px; font-weight: 700; color: #5D4037; line-height: 1;">${totalGoals}</span>
            </div>
            <div style="font-size: 13px; color: #6D4C41; font-weight: 600; line-height: 1.3;">🎯 Total Goals</div>
          </td>
        </tr>
      </table>
      
      <!-- Goals Table -->
      <div style="background: linear-gradient(135deg, #EFEBE9 0%, #F5F5F5 100%); padding: 25px 20px; border-radius: 12px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 0;">
              <span style="font-size: 24px; vertical-align: middle; display: inline-block; margin-right: 8px;">📋</span>
              <span style="font-size: 20px; font-weight: 700; color: #3E2723; vertical-align: middle; display: inline-block;">Today's Missions</span>
            </td>
          </tr>
        </table>
        <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);">
                <th style="padding: 16px; text-align: left; font-size: 14px; font-weight: 600; color: white; border: none;">Goal</th>
                <th style="padding: 16px; text-align: center; font-size: 14px; font-weight: 600; color: white; border: none; white-space: nowrap;">Time</th>
                <th style="padding: 16px; text-align: center; font-size: 14px; font-weight: 600; color: white; border: none; min-width: 120px;">Progress</th>
              </tr>
            </thead>
            <tbody>${goalsHtml}</tbody>
          </table>
        </div>
      </div>
      
      <!-- Motivational Message -->
      <div style="background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%); border-left: 5px solid #F57C00; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 16px; color: #E65100; font-weight: 600; text-align: center;">
          💡 ${randomMessage}
        </p>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="background: white; padding: 35px 30px; text-align: center; border-top: 3px solid #EFEBE9;">
      <a href="${env.FRONTEND_URL}/calendar" style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%); color: white; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 17px; box-shadow: 0 6px 16px rgba(141, 110, 99, 0.3); transition: transform 0.2s;">
        🚀 Start Your Day
      </a>
    </div>
    
    <!-- Footer -->
    <div style="background: white; border-radius: 0 0 20px 20px; padding: 30px; text-align: center; border-top: 3px solid #EFEBE9; box-shadow: 0 10px 25px rgba(141, 110, 99, 0.2);">
      <p style="margin: 0 0 8px 0; font-size: 15px; color: #6D4C41; font-weight: 600;">💪 Stay consistent, stay awesome!</p>
      <p style="margin: 0; font-size: 13px; color: #A1887F;">You're receiving this because you're part of Capybara Tracker</p>
    </div>
    
    <!-- Capybara Footer -->
    <div style="text-align: center; margin-top: 30px;">
      <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px; opacity: 0.7;">
        <ellipse cx="60" cy="75" rx="40" ry="30" fill="#8D6E63" opacity="0.5"/>
        <ellipse cx="60" cy="45" rx="28" ry="25" fill="#A1887F" opacity="0.5"/>
        <ellipse cx="45" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
        <ellipse cx="75" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
        <path d="M 50 42 Q 52 44 54 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        <path d="M 66 42 Q 68 44 70 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        <ellipse cx="60" cy="52" rx="5" ry="3" fill="#6D4C41" opacity="0.5"/>
        <path d="M 52 58 Q 60 62 68 58" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
      </svg>
      <p style="margin: 0; font-size: 14px; color: #8D6E63; font-weight: 600;">Powered by Capybara Tracker 🦫</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #A1887F;">Your calm productivity companion</p>
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
