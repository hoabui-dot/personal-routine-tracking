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
  setSessionStatusByUser: React.Dispatch<React.SetStateAction<Record<string, 'IN_PROGRESS' | 'PAUSED' | 'DONE' | 'MISSED'>>>;
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
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
          
          // Skip if no valid data
          if (!data || !data.startedAt) {
            return;
          }
          
          const statusKey = `${userId}-${data.date}`;
          
          // Only increment if status is IN_PROGRESS
          if (sessionStatusByUser[statusKey] === 'IN_PROGRESS') {
            const startTime = new Date(data.startedAt).getTime();
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            const activeElapsed = Math.max(0, totalElapsed - data.pausedSeconds);
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
      // Fetch latest session data from server
      const today = new Date().toISOString().split('T')[0];
      const latestSessions = await gameApi.getSessions({
        date: today,
      });

      // Track which users have active sessions
      const activeUserIds = new Set<number>();

      // Update timer data with latest from server
      latestSessions.forEach(session => {
        // Session is actively timing (has started_at and is IN_PROGRESS)
        if (session.status === 'IN_PROGRESS' && session.started_at && session.id) {
          activeUserIds.add(session.user_id);
          
          const startTime = new Date(session.started_at).getTime();
          const now = Date.now();
          const totalElapsed = Math.floor((now - startTime) / 1000);
          const pausedSeconds = session.total_paused_seconds || 0;
          const activeElapsed = Math.max(0, totalElapsed - pausedSeconds);

          setTimeElapsedByUser(prev => ({
            ...prev,
            [session.user_id]: activeElapsed,
          }));

          const statusKey = `${session.user_id}-${session.date}`;
          setSessionStatusByUser(prev => ({
            ...prev,
            [statusKey]: session.status,
          }));

          // Update timer data ref with current session info
          timerDataRef.current[session.user_id] = {
            sessionId: session.id,
            startedAt: session.started_at,
            pausedSeconds: session.total_paused_seconds || 0,
            date: session.date,
          };
        }
        // Session is paused (has started_at and paused_at)
        else if (session.status === 'PAUSED' && session.started_at && session.paused_at && session.id) {
          activeUserIds.add(session.user_id);
          
          const startTime = new Date(session.started_at).getTime();
          const pauseTime = new Date(session.paused_at).getTime();
          const pausedSeconds = session.total_paused_seconds || 0;
          const elapsedBeforePause = Math.floor((pauseTime - startTime) / 1000);
          const activeElapsed = Math.max(0, elapsedBeforePause - pausedSeconds);

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
          timerDataRef.current[session.user_id] = {
            sessionId: session.id,
            startedAt: session.started_at,
            pausedSeconds: session.total_paused_seconds || 0,
            date: session.date,
          };
        }
        // Session is IN_PROGRESS but NO started_at (waiting for next sub-task)
        // This happens after completing a sub-task - timer should be reset to 0
        else if (session.status === 'IN_PROGRESS' && !session.started_at) {
          // Clear timer data - user needs to start a new sub-task
          delete timerDataRef.current[session.user_id];
          setTimeElapsedByUser(prev => {
            const updated = { ...prev };
            delete updated[session.user_id];
            return updated;
          });
          
          // Keep status as IN_PROGRESS but no active timer
          const statusKey = `${session.user_id}-${session.date}`;
          setSessionStatusByUser(prev => {
            const updated = { ...prev };
            delete updated[statusKey];
            return updated;
          });
          
          console.log(`🔄 Session ${session.id} waiting for next sub-task (timer reset)`);
        }
        // Session is completed or missed
        else if (session.status === 'DONE' || session.status === 'MISSED') {
          // Clean up timer data for completed/missed sessions
          delete timerDataRef.current[session.user_id];
          setTimeElapsedByUser(prev => {
            const updated = { ...prev };
            delete updated[session.user_id];
            return updated;
          });
          
          const statusKey = `${session.user_id}-${session.date}`;
          setSessionStatusByUser(prev => {
            const updated = { ...prev };
            delete updated[statusKey];
            return updated;
          });
        }
      });

      console.log('🔄 Timer synced with server');
    } catch (error) {
      console.error('Failed to sync timer with server:', error);
    }
  }, []);

  // Initialize timer state on mount by syncing with server immediately
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      console.log('🚀 Initializing TimerContext - fetching active sessions...');
      await syncWithServer();
      if (mounted) {
        setIsInitialized(true);
        console.log('✅ TimerContext initialized');
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  // Sync with server every 30 seconds
  useEffect(() => {
    if (!isInitialized) return; // Don't start interval until initialized

    syncIntervalRef.current = setInterval(() => {
      syncWithServer();
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncWithServer, isInitialized]);

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
    // Clear timer data ref
    delete timerDataRef.current[userId];
    
    // Clear elapsed time
    setTimeElapsedByUser(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });

    // Clear status for this user (all dates)
    setSessionStatusByUser(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${userId}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });

    console.log(`🔄 Timer reset for user ${userId} - cleared all timer data`);
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
    setSessionStatusByUser,
    isInitialized,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
