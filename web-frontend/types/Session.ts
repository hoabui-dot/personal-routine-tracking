export interface Session {
  id: number;
  sub_goal_id: number;
  started_at: string;
  ended_at: string | null;
  hours_spent: number;
  created_at: string;
}

export interface CreateSessionRequest {
  sub_goal_id: number;
}

export interface SessionStats {
  total_sessions: number;
  total_hours: number;
  avg_hours_per_session: number;
  hours_expected: number;
  completion_percentage: number;
}
