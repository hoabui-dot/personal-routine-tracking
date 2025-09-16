// Goal type definitions

export interface Goal {
  id: number;
  title: string;
  year: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGoalRequest {
  title: string;
  year: number;
}

export interface UpdateGoalRequest {
  title?: string;
  year?: number;
}

export interface GoalResponse {
  id: number;
  title: string;
  year: number;
  created_at: string;
  updated_at: string;
}

// Sub-goal type definitions
export interface SubGoal {
  id: number;
  goal_id: number;
  title: string;
  hours_expected: number;
  start_month: number;
  end_month: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubGoalRequest {
  goal_id: number;
  title: string;
  hours_expected: number;
  start_month: number;
  end_month: number;
}

// Session type definitions
export interface Session {
  id: number;
  sub_goal_id: number;
  started_at: Date;
  ended_at: Date | null;
  hours_spent: number;
  created_at: Date;
}

export interface CreateSessionRequest {
  sub_goal_id: number;
  started_at?: Date;
}

export interface EndSessionRequest {
  ended_at?: Date;
}
