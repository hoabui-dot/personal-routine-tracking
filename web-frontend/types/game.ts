export interface User {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserGoal {
  id: number;
  user_id: number;
  user_name: string;
  goal_id: number;
  goal_title: string;
  daily_duration_minutes: number;
  daily_duration_hours: number;
  is_paused?: boolean;
  paused_at?: string | null;
}

export interface GoalSubTask {
  id: number;
  user_goal_id: number;
  title: string;
  duration_minutes: number;
  display_order: number;
  created_at: string;
  updated_at: string;
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
  sub_task_id?: number | null;
}

export interface GameSummary {
  user_id: number;
  user_name: string;
  total_done: number;
  total_missed: number;
  total_minutes_worked: number;
  total_hours_worked: number;
}
