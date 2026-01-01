export interface User {
  id: number;
  name: string;
  avatar_url?: string;
  created_at: string;
  user_id: string;
}

export interface UserGoal {
  id: number;
  user_id: number;
  user_name: string;
  goal_id: number;
  goal_title: string;
  daily_duration_minutes: number;
  daily_duration_hours: number;
}

export interface DailySession {
  id: number;
  user_id: number;
  user_name?: string;
  goal_id: number;
  date: string;
  started_at: string | null;
  finished_at: string | null;
  paused_at: string | null;
  total_paused_seconds: number;
  duration_completed_minutes: number;
  status: 'DONE' | 'MISSED' | 'IN_PROGRESS' | 'PAUSED';
  created_at: string;
  updated_at: string;
}

export interface GameSummary {
  user_id: number;
  user_name: string;
  total_done: number;
  total_missed: number;
}
