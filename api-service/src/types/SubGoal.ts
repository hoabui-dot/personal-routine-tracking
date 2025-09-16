export interface SubGoal {
  id: number;
  goal_id: number;
  title: string;
  hours_expected: number;
  start_month: number;
  end_month: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubGoalRequest {
  goal_id: number;
  title: string;
  hours_expected: number;
  start_month: number;
  end_month: number;
}

export interface UpdateSubGoalRequest {
  title?: string;
  hours_expected?: number;
  start_month?: number;
  end_month?: number;
}
