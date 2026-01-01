export interface User {
  id: number;
  name: string;
  created_at: Date;
}

export interface UserGoal {
  id: number;
  user_id: number;
  goal_id: number;
  daily_duration_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface DailySession {
  id: number;
  user_id: number;
  goal_id: number;
  date: string;
  started_at: Date | null;
  finished_at: Date | null;
  duration_completed_minutes: number;
  status: 'DONE' | 'MISSED' | 'IN_PROGRESS';
  created_at: Date;
  updated_at: Date;
}

export interface UserGoalResponse {
  id: number;
  user_id: number;
  user_name: string;
  goal_id: number;
  goal_title: string;
  daily_duration_minutes: number;
  daily_duration_hours: number;
}

export interface DailySessionResponse {
  id: number;
  user_id: number;
  user_name: string;
  goal_id: number;
  date: string;
  started_at: string | null;
  finished_at: string | null;
  duration_completed_minutes: number;
  status: 'DONE' | 'MISSED' | 'IN_PROGRESS';
  created_at: string;
  updated_at: string;
}

export interface GameSummary {
  user_id: number;
  user_name: string;
  total_done: number;
  total_missed: number;
  current_streak: number;
}

export interface StartSessionRequest {
  user_id: number;
  goal_id: number;
  date: string;
}

export interface StopSessionRequest {
  session_id: number;
}

export interface UpdateUserGoalRequest {
  daily_duration_minutes: number;
}
