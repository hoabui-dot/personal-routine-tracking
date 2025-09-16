export interface SubGoal {
  id: number;
  goal_id: number;
  title: string;
  description?: string;
  hours_expected: number;
  start_date: string; // DD/MM format
  end_date: string; // DD/MM format
  // Legacy fields for backward compatibility
  start_month?: number;
  end_month?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubGoalRequest {
  goal_id: number;
  title: string;
  description?: string;
  hours_expected: number;
  start_date: string; // DD/MM format
  end_date: string; // DD/MM format
}

export interface UpdateSubGoalRequest {
  title?: string;
  description?: string;
  hours_expected?: number;
  start_date?: string;
  end_date?: string;
}
