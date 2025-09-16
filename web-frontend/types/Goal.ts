// Frontend Goal type definitions

export interface Goal {
  id: number;
  title: string;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRequest {
  title: string;
  year: number;
}

export interface UpdateGoalRequest {
  title?: string;
  year?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  message?: string;
  count?: number;
}

export interface GoalsListResponse extends ApiResponse<Goal[]> {
  count: number;
}
