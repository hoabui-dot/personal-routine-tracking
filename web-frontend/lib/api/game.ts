import { User, UserGoal, DailySession, GameSummary } from '../../types/game';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const gameApi = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // User Goals
  getUserGoals: async (): Promise<UserGoal[]> => {
    const response = await fetch(`${API_URL}/user-goals`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  updateUserGoal: async (userId: number, goalId: number, durationMinutes: number): Promise<UserGoal> => {
    const response = await fetch(`${API_URL}/user-goals/${userId}/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_duration_minutes: durationMinutes }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
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

    const url = `${API_URL}/daily-sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  getSummary: async (goalId?: number): Promise<GameSummary[]> => {
    const url = goalId ? `${API_URL}/daily-sessions/summary?goalId=${goalId}` : `${API_URL}/daily-sessions/summary`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  startSession: async (userId: number, goalId: number, date: string): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/daily-sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, goal_id: goalId, date }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  stopSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/daily-sessions/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  completeSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/daily-sessions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  pauseSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/daily-sessions/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  resumeSession: async (sessionId: number): Promise<DailySession> => {
    const response = await fetch(`${API_URL}/daily-sessions/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  checkAndCleanup: async (): Promise<{ cleanedUp: number; autoPaused: number; sessions: DailySession[] }> => {
    const response = await fetch(`${API_URL}/daily-sessions/check-and-cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
};
