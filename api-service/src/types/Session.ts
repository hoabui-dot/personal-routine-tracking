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

export interface StopSessionRequest {
  ended_at?: string; // Optional, defaults to current timestamp
}
