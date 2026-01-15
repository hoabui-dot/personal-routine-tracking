import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { gameApi } from '../lib/api/game';

interface TimerContextType {
  timeElapsedByUser: Record<number, number>;
  sessionStatusByUser: Record<string, 'IN_PROGRESS' | 'PAUSED' | 'DONE' | 'MISSED'>;
  startTimer: (userId: number, sessionId: number, startedAt: string, pausedSeconds: number, date: string) => void;
  stopTimer: (userId: number) => void;
  pauseTimer: (userId: number, date: string) => void;
  resumeTimer: (userId: number, date: string) => void;
  resetTimer: (userId: number) => void;
  syncWithServer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [timeElapsedByUser, setTimeElapsedByUser] = useState<Record<number, number>>({});
  const [sessionStatusByUser, setSessionStatusByUser] = useState<Record<string, 'IN_PROGRESS' | 'PAUSED' | 'DONE' | 'MISSED'>>({});
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerDataRef = useRef<Record<number, { sessionId: number; startedAt: string; pausedSeconds: number; date: string }>>({});

  // Timer tick - runs every second
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsedByUser(prev => {
        const updated = { ...prev };
        Object.keys(timerDataRef.current).forEach(userIdStr => {
          const userId = parseInt(userIdStr);
          const data = timerDataRef.current[userId];
          const statusKey = `${userId}-${data.date}`;
          
          // Only increment if status is IN_PROGRESS
          if (sessionStatusByUser[statusKey] === 'IN_PROGRESS') {
            const startTime = new Date(data.startedAt).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const activeElapsed = totalElapsed - data.pausedSeconds;
            updated[userId] = activeElapsed;
          }
        });
        return updated;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionStatusByUser]);

  // Sync with server every 30 seconds
  const syncWithServer = useCallback(async () => {
    try {
      const activeSessions = Object.keys(timerDataRef.current).map(userIdStr => {
        const userId = parseInt(userIdStr);
        return timerDataRef.current[userId];
      });

      if (activeSessions.length === 0) return;

      // Fetch latest session data from server
      const today = new Date().toISOString().split('T')[0];
      const latestSessions = await gameApi.getSessions({
        date: today,
      });

      // Update timer data with latest from server
      latestSessions.forEach(session => {
        if (session.status === 'IN_PROGRESS' || session.status === 'PAUSED') {
          if (session.started_at) {
            const startTime = new Date(session.started_at).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const pausedSeconds = session.total_paused_seconds || 0;
            
            let activeElapsed = totalElapsed - pausedSeconds;
            if (session.status === 'PAUSED' && session.paused_at) {
              const pauseTime = new Date(session.paused_at).getTime();
              const elapsedBeforePause = Math.floor((pauseTime - startTime) / 1000);
              activeElapsed = elapsedBeforePause - pausedSeconds;
            }

            setTimeElapsedByUser(prev => ({
              ...prev,
              [session.user_id]: activeElapsed,
            }));

            const statusKey = `${session.user_id}-${session.date}`;
            setSessionStatusByUser(prev => ({
              ...prev,
              [statusKey]: session.status,
            }));

            // Update timer data ref
            if (session.started_at) {
              timerDataRef.current[session.user_id] = {
                sessionId: session.id!,
                startedAt: session.started_at,
                pausedSeconds: session.total_paused_seconds || 0,
                date: session.date,
              };
            }
          }
        }
      });

      console.log('🔄 Timer synced with server');
    } catch (error) {
      console.error('Failed to sync timer with server:', error);
    }
  }, []);

  // Sync with server every 30 seconds
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      syncWithServer();
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncWithServer]);

  const startTimer = useCallback((userId: number, sessionId: number, startedAt: string, pausedSeconds: number, date: string) => {
    timerDataRef.current[userId] = {
      sessionId,
      startedAt,
      pausedSeconds,
      date,
    };

    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const totalElapsed = Math.floor((now - startTime) / 1000);
    const activeElapsed = totalElapsed - pausedSeconds;

    setTimeElapsedByUser(prev => ({
      ...prev,
      [userId]: activeElapsed,
    }));

    const statusKey = `${userId}-${date}`;
    setSessionStatusByUser(prev => ({
      ...prev,
      [statusKey]: 'IN_PROGRESS',
    }));

    console.log(`⏱️ Timer started for user ${userId}`);
  }, []);

  const stopTimer = useCallback((userId: number) => {
    delete timerDataRef.current[userId];
    
    setTimeElapsedByUser(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });

    // Remove all status entries for this user
    setSessionStatusByUser(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${userId}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });

    console.log(`⏹️ Timer stopped for user ${userId}`);
  }, []);

  const pauseTimer = useCallback((userId: number, date: string) => {
    const statusKey = `${userId}-${date}`;
    setSessionStatusByUser(prev => ({
      ...prev,
      [statusKey]: 'PAUSED',
    }));

    console.log(`⏸️ Timer paused for user ${userId}`);
  }, []);

  const resumeTimer = useCallback((userId: number, date: string) => {
    const statusKey = `${userId}-${date}`;
    setSessionStatusByUser(prev => ({
      ...prev,
      [statusKey]: 'IN_PROGRESS',
    }));

    console.log(`▶️ Timer resumed for user ${userId}`);
  }, []);

  const resetTimer = useCallback((userId: number) => {
    delete timerDataRef.current[userId];
    
    setTimeElapsedByUser(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });

    console.log(`🔄 Timer reset for user ${userId}`);
  }, []);

  const value = {
    timeElapsedByUser,
    sessionStatusByUser,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    syncWithServer,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
