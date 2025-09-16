import axios from 'axios';
import {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  ApiResponse,
  GoalsListResponse,
} from '@/types/Goal';
import {
  SubGoal,
  CreateSubGoalRequest,
  UpdateSubGoalRequest,
} from '@/types/SubGoal';
import { Session, CreateSessionRequest, SessionStats } from '@/types/Session';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Goals API functions
export const goalsApi = {
  // Get all goals
  getAll: async (year?: number): Promise<Goal[]> => {
    try {
      const params = year ? { year } : {};
      const response = await api.get<GoalsListResponse>('/goals', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw new Error('Failed to fetch goals');
    }
  },

  // Get a specific goal
  getById: async (id: number): Promise<Goal> => {
    try {
      const response = await api.get<ApiResponse<Goal>>(`/goals/${id}`);
      if (!response.data.data) {
        throw new Error('Goal not found');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw new Error('Failed to fetch goal');
    }
  },

  // Create a new goal
  create: async (goalData: CreateGoalRequest): Promise<Goal> => {
    try {
      const response = await api.post<ApiResponse<Goal>>('/goals', goalData);
      if (!response.data.data) {
        throw new Error('Failed to create goal');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      if (axios.isAxiosError(error) && error.response?.data?.details) {
        throw new Error(error.response.data.details.join(', '));
      }
      throw new Error('Failed to create goal');
    }
  },

  // Update a goal
  update: async (id: number, goalData: UpdateGoalRequest): Promise<Goal> => {
    try {
      const response = await api.put<ApiResponse<Goal>>(
        `/goals/${id}`,
        goalData
      );
      if (!response.data.data) {
        throw new Error('Failed to update goal');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating goal:', error);
      if (axios.isAxiosError(error) && error.response?.data?.details) {
        throw new Error(error.response.data.details.join(', '));
      }
      throw new Error('Failed to update goal');
    }
  },

  // Delete a goal
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/goals/${id}`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal');
    }
  },
};

// Sub-goals API
export const subGoalsApi = {
  // Get all sub-goals for a goal
  getByGoalId: async (goalId: number): Promise<SubGoal[]> => {
    try {
      const response = await api.get(`/sub-goals/goal/${goalId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sub-goals:', error);
      throw new Error('Failed to fetch sub-goals');
    }
  },

  // Get specific sub-goal
  getById: async (id: number): Promise<SubGoal> => {
    try {
      const response = await api.get(`/sub-goals/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sub-goal:', error);
      throw new Error('Failed to fetch sub-goal');
    }
  },

  // Create new sub-goal
  create: async (data: CreateSubGoalRequest): Promise<SubGoal> => {
    try {
      const response = await api.post('/sub-goals', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating sub-goal:', error);
      throw new Error('Failed to create sub-goal');
    }
  },

  // Update sub-goal
  update: async (id: number, data: UpdateSubGoalRequest): Promise<SubGoal> => {
    try {
      const response = await api.put(`/sub-goals/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating sub-goal:', error);
      throw new Error('Failed to update sub-goal');
    }
  },

  // Delete sub-goal
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/sub-goals/${id}`);
    } catch (error) {
      console.error('Error deleting sub-goal:', error);
      throw new Error('Failed to delete sub-goal');
    }
  },
};

// Sessions API
export const sessionsApi = {
  // Get sessions for a sub-goal
  getBySubGoalId: async (subGoalId: number): Promise<Session[]> => {
    try {
      const response = await api.get(`/sessions/sub-goal/${subGoalId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new Error('Failed to fetch sessions');
    }
  },

  // Get active session for a sub-goal
  getActiveBySubGoalId: async (subGoalId: number): Promise<Session | null> => {
    try {
      const response = await api.get(`/sessions/sub-goal/${subGoalId}/active`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw new Error('Failed to fetch active session');
    }
  },

  // Start new session
  start: async (data: CreateSessionRequest): Promise<Session> => {
    try {
      const response = await api.post('/sessions', data);
      return response.data.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error('Failed to start session');
    }
  },

  // Stop session
  stop: async (id: number): Promise<Session> => {
    try {
      const response = await api.put(`/sessions/${id}/stop`, {});
      return response.data.data;
    } catch (error) {
      console.error('Error stopping session:', error);
      throw new Error('Failed to stop session');
    }
  },

  // Get session statistics
  getStats: async (subGoalId: number): Promise<SessionStats> => {
    try {
      const response = await api.get(`/sessions/sub-goal/${subGoalId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw new Error('Failed to fetch session statistics');
    }
  },
};

export default api;
