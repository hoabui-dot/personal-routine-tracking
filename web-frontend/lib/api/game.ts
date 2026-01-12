import { User, UserGoal, DailySession, GameSummary, GoalSubTask } from '../../types/game';
import { clientEnv } from '../env';

const API_URL = clientEnv.NEXT_PUBLIC_API_URL;

export const gameApi = {
  // Goals
  getGoals: async (year?: number): Promise<any[]> => {
    const url = year ? `${API_URL}/goals?year=${year}` : `${API_URL}/goals`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  createGoal: async (title: string, year: number): Promise<any> => {
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, year }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  updateGoal: async (id: number, updates: { title?: string; year?: number }): Promise<any> => {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  deleteGoal: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/game/users`, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // User Goals
  getUserGoals: async (): Promise<UserGoal[]> => {
    const response = await fetch(`${API_URL}/game/user-goals`, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  updateUserGoal: async (userId: number, goalId: number, durationMinutes: number): Promise<UserGoal> => {
    const response = await fetch(`${API_URL}/game/user-goals/${userId}/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ daily_duration_minutes: durationMinutes }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  pauseUserGoal: async (userId: number, goalId: number): Promise<UserGoal> => {
    const response = await fetch(`${API_URL}/game/user-goals/${userId}/${goalId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  unpauseUserGoal: async (userId: number, goalId: number): Promise<UserGoal> => {
    const response = await fetch(`${API_URL}/game/user-goals/${userId}/${goalId}/unpause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Goal Sub-Tasks
  getGoalSubTasks: async (userGoalId?: number): Promise<GoalSubTask[]> => {
    const url = userGoalId 
      ? `${API_URL}/goal-sub-tasks?userGoalId=${userGoalId}`
      : `${API_URL}/goal-sub-tasks`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  createGoalSubTask: async (userGoalId: number, title: string, durationMinutes: number): Promise<GoalSubTask> => {
    const response = await fetch(`${API_URL}/goal-sub-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        user_goal_id: userGoalId, 
        title, 
        duration_minutes: durationMinutes 
      }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  updateGoalSubTask: async (id: number, updates: { title?: string; duration_minutes?: number }): Promise<GoalSubTask> => {
    const response = await fetch(`${API_URL}/goal-sub-tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  deleteGoalSubTask: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/goal-sub-tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },

  // Daily Sessions
  getSessions: async (params?: {
    userId?: number;
    goalId?: number;
    startDate?: string;
    endDate?: string;
    date?: string;
  }): Promise<DailySession[]> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.goalId) queryParams.append('goalId', params.goalId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.date) queryParams.append('date', params.date);

    const url = `${API_URL}/game/daily-sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  getSummary: async (goalId?: number): Promise<GameSummary[]> => {
    const url = goalId ? `${API_URL}/game/daily-sessions/summary?goalId=${goalId}` : `${API_URL}/game/daily-sessions/summary`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  startSession: async (userId: number, goalId: number, date: string, subTaskId?: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId, goal_id: goalId, date, sub_task_id: subTaskId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  stopSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  completeSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  completeSubTask: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/complete-subtask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  getCompletedSubTasks: async (sessionId: number): Promise<any[]> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/${sessionId}/completed-subtasks`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  pauseSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  resumeSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  checkAndCleanup: async (): Promise<{ cleanedUp: number; autoPaused: number; sessions: DailySession[] }> => {
    const response = await fetch(`${API_URL}/game/daily-sessions/check-and-cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
};
