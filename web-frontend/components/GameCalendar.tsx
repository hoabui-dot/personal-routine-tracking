import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gameApi } from '../lib/api/game';
import { User, UserGoal, DailySession, GameSummary, GoalSubTask } from '../types/game';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CustomSelect } from './ui/CustomSelect';

const GameCalendar: React.FC = () => {
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  
  // Get today's date in local timezone (YYYY-MM-DD format)
  const getTodayLocal = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayLocal();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [summary, setSummary] = useState<GameSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [selectedSubTaskByUser, setSelectedSubTaskByUser] = useState<Record<number, number | null>>({});
  const [allSubTasks, setAllSubTasks] = useState<GoalSubTask[]>([]);
  const [timeElapsedByUser, setTimeElapsedByUser] = useState<Record<number, number>>({});
  const [sessionStatusByUser, setSessionStatusByUser] = useState<Record<string, 'IN_PROGRESS' | 'PAUSED' | 'DONE' | 'MISSED'>>({});
  const [initialized, setInitialized] = useState(false);
  const toast = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sync with server every 30 seconds for active sessions
  const syncWithServer = useCallback(async () => {
    try {
      const activeSessions = sessions.filter(s => 
        (s.status === 'IN_PROGRESS' || s.status === 'PAUSED') && 
        s.date === today
      );
      
      if (activeSessions.length === 0) return;
      
      // Fetch latest session data from server
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      const latestSessions = await gameApi.getSessions({
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
      });
      
      // Update sessions state with latest data
      setSessions(latestSessions);
      
      console.log('🔄 Synced with server - updated session data');
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }, [sessions, today, year, month]);

  // Background API call helper (fire and forget)
  const callApiInBackground = (apiCall: () => Promise<any>, successMessage?: string) => {
    apiCall()
      .then(() => {
        if (successMessage) {
          toast.success(successMessage);
        }
        // Reload data after API call completes
        loadData();
      })
      .catch((error) => {
        console.error('Background API call failed:', error);
        toast.error(error.message || 'Operation failed');
        // Reload data to revert optimistic updates
        loadData();
      });
  };

  const loadData = useCallback(async () => {
    try {
      const [usersData, goalsData, summaryData, subTasksData] = await Promise.all([
        gameApi.getUsers(),
        gameApi.getUserGoals(),
        gameApi.getSummary(),
        gameApi.getGoalSubTasks(),
      ]);
      
      setUsers(usersData);
      setUserGoals(goalsData);
      setSummary(summaryData);
      setAllSubTasks(subTasksData);
      
      // Set default selected goal if not set
      if (!selectedGoalId && goalsData.length > 0) {
        setSelectedGoalId(goalsData[0].goal_id);
      }

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      const sessionsData = await gameApi.getSessions({
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
      });
      setSessions(sessionsData);
    } catch (error) {
      console.error('[GameCalendar Error] Failed to load data:', {
        year,
        month,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error('Failed to load game data');
    }
  }, [year, month, toast, selectedGoalId]);

  const initializeApp = useCallback(async () => {
    if (initialized) return;
    
    try {
      // Load sub-tasks first so they're available for initialization
      const subTasksData = await gameApi.getGoalSubTasks();
      setAllSubTasks(subTasksData);
      
      const result = await gameApi.checkAndCleanup();
      
      if (result.cleanedUp > 0) {
        toast.info(`${result.cleanedUp} session(s) from previous days marked as MISSED`);
      }
      
      const goals = await gameApi.getUserGoals();
      const newTimeElapsed: Record<number, number> = {};
      const newSessionStatus: Record<string, 'IN_PROGRESS' | 'PAUSED' | 'DONE' | 'MISSED'> = {};
      
      if (result.sessions && result.sessions.length > 0) {
        result.sessions.forEach((session: DailySession) => {
          if (session.status === 'IN_PROGRESS' || session.status === 'PAUSED') {
            const userGoal = goals.find(g => g.user_id === session.user_id);
            
            if (userGoal && session.started_at) {
              const startTime = new Date(session.started_at).getTime();
              const now = Date.now();
              const totalElapsed = Math.floor((now - startTime) / 1000);
              const pausedSeconds = session.total_paused_seconds || 0;
              
              // For PAUSED sessions, calculate time at pause point
              let activeElapsed = totalElapsed - pausedSeconds;
              if (session.status === 'PAUSED' && session.paused_at) {
                const pauseTime = new Date(session.paused_at).getTime();
                const elapsedBeforePause = Math.floor((pauseTime - startTime) / 1000);
                activeElapsed = elapsedBeforePause - pausedSeconds;
              }
              
              // Store elapsed time (count up)
              newTimeElapsed[session.user_id] = activeElapsed;
              
              // Determine target duration for logging
              let required = userGoal.daily_duration_minutes * 60;
              if (session.sub_task_id) {
                const subTask = subTasksData.find(st => st.id === session.sub_task_id);
                if (subTask) {
                  required = subTask.duration_minutes * 60;
                  console.log(`[Init] Using sub-task duration for user ${session.user_id}: ${subTask.duration_minutes}min (${subTask.title})`);
                } else {
                  console.warn(`[Init] Sub-task ${session.sub_task_id} not found, using goal duration`);
                }
              }
              
              console.log(`[Init] User ${session.user_id}: target=${required}s, elapsed=${activeElapsed}s`);
              
              // Use date-aware key for session status
              const statusKey = `${session.user_id}-${session.date}`;
              newSessionStatus[statusKey] = session.status;
            }
          }
        });
      }
      
      setTimeElapsedByUser(newTimeElapsed);
      setSessionStatusByUser(newSessionStatus);
      setInitialized(true);
    } catch (error) {
      console.error('[GameCalendar Error] Failed to initialize:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      setInitialized(true);
    }
  }, [initialized, toast]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const activeSessions = sessions.filter(s => 
      (s.status === 'IN_PROGRESS' || s.status === 'PAUSED') && 
      s.date === today
    );
    
    // Clear existing intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    if (activeSessions.length === 0) {
      return;
    }

    const updateTimers = () => {
      const newTimeElapsed: Record<number, number> = {};
      
      activeSessions.forEach(session => {
        const userGoal = userGoals.find(ug => ug.user_id === session.user_id);
        if (!userGoal || !session.started_at) return;

        const startTime = new Date(session.started_at).getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTime) / 1000);
        const pausedSeconds = session.total_paused_seconds || 0;
        
        // For PAUSED sessions, don't count time after pause
        let activeElapsed = totalElapsed - pausedSeconds;
        
        // If session is paused, freeze the elapsed time
        if (session.status === 'PAUSED' && session.paused_at) {
          const pauseTime = new Date(session.paused_at).getTime();
          const elapsedBeforePause = Math.floor((pauseTime - startTime) / 1000);
          activeElapsed = elapsedBeforePause - pausedSeconds;
        }
        
        // Store elapsed time (count up)
        newTimeElapsed[session.user_id] = activeElapsed;
      });
      
      setTimeElapsedByUser(newTimeElapsed);
    };

    updateTimers();

    const inProgressSessions = activeSessions.filter(s => s.status === 'IN_PROGRESS');
    if (inProgressSessions.length > 0) {
      // Update timers every second for IN_PROGRESS sessions
      timerIntervalRef.current = setInterval(updateTimers, 1000);
    }

    // Sync with server every 30 seconds for all active sessions
    syncIntervalRef.current = setInterval(syncWithServer, 30000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [sessions, today, userGoals, loadData, toast, syncWithServer]);

  // Check if the logged-in user can perform actions for a specific user
  const canUserAct = (targetUserId: number): boolean => {
    if (!authUser) {
      console.log('canUserAct: No authenticated user');
      return false;
    }
    
    const canAct = authUser.id === targetUserId;
    console.log('canUserAct:', {
      loggedInUserId: authUser.id,
      loggedInUserName: authUser.name,
      loggedInUserEmail: authUser.email,
      targetUserId,
      canAct
    });
    
    return canAct;
  };

  const handleStartSession = (userId: number, subTaskId?: number) => {
    if (!selectedDate) return;
    
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    const userGoal = userGoals.find(ug => ug.user_id === userId && ug.goal_id === selectedGoalId);
    const goalId = userGoal?.goal_id;
    if (!goalId) {
      toast.error('Goal not found');
      return;
    }

    // Immediate UI update (optimistic)
    if (userGoal) {
      // Start with 0 elapsed time
      setTimeElapsedByUser(prev => ({
        ...prev,
        [userId]: 0
      }));
      const statusKey = `${userId}-${selectedDate}`;
      setSessionStatusByUser(prev => ({
        ...prev,
        [statusKey]: 'IN_PROGRESS'
      }));
    }

    // Background API call
    callApiInBackground(
      () => gameApi.startSession(userId, goalId, selectedDate, subTaskId),
      'Session started! ⏱️'
    );
  };

  const handleStopSession = (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      '⚠️ WARNING: Stopping will end this session permanently!\n\n' +
      'You will NOT be able to pause or resume after stopping.\n' +
      'The session will be marked as incomplete if you haven\'t reached your goal.\n\n' +
      'Are you sure you want to STOP this session?'
    );
    
    if (!confirmed) return;
    
    // Immediate UI update (optimistic)
    setTimeElapsedByUser(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    setSessionStatusByUser(prev => {
      const updated = { ...prev };
      // Remove all entries for this user (across all dates)
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${userId}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });

    // Background API call
    callApiInBackground(
      () => gameApi.stopSession(sessionId),
      'Session stopped ⏹️'
    );
  };

  const handlePauseSession = (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    // Immediate UI update (optimistic)
    const statusKey = `${userId}-${selectedDate}`;
    setSessionStatusByUser(prev => ({
      ...prev,
      [statusKey]: 'PAUSED'
    }));

    // Background API call
    callApiInBackground(
      () => gameApi.pauseSession(sessionId),
      'Session paused ⏸️'
    );
  };

  const handleResumeSession = (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    // Immediate UI update (optimistic)
    const statusKey = `${userId}-${selectedDate}`;
    setSessionStatusByUser(prev => ({
      ...prev,
      [statusKey]: 'IN_PROGRESS'
    }));

    // Background API call
    callApiInBackground(
      () => gameApi.resumeSession(sessionId),
      'Session resumed ▶️'
    );
  };

  const handleCompleteSubTask = (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      '✅ Complete this sub-task?\n\n' +
      'This will mark the current sub-task as done and allow you to start the next one.\n' +
      'Your progress will be saved.'
    );
    
    if (!confirmed) return;
    
    // Immediate UI update (optimistic) - reset timer
    setTimeElapsedByUser(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });

    // Background API call
    callApiInBackground(
      () => gameApi.completeSubTask(sessionId),
      'Sub-task completed! ✅'
    );
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getSessionForDate = (userId: number, date: string) => {
    return sessions.find(s => s.user_id === userId && s.date === date);
  };

  // Get current session status (optimistic or from server)
  const getCurrentSessionStatus = (userId: number, date: string, session?: DailySession) => {
    // Use optimistic status if available for this specific date, otherwise fall back to session status
    const optimisticKey = `${userId}-${date}`;
    return sessionStatusByUser[optimisticKey] || session?.status;
  };

  // Check if session should show timer (optimistic)
  const shouldShowTimer = (userId: number, date: string, session?: DailySession) => {
    const status = getCurrentSessionStatus(userId, date, session);
    return status === 'IN_PROGRESS' || status === 'PAUSED';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (userId: number) => {
    const timeElapsed = timeElapsedByUser[userId];
    if (timeElapsed === undefined) return 0;
    
    const userGoal = userGoals.find(ug => ug.user_id === userId);
    if (!userGoal) return 0;

    // Get the session to check if it has a sub-task
    const session = sessions.find(s => s.user_id === userId && s.date === today);
    let required = userGoal.daily_duration_minutes * 60;
    
    if (session?.sub_task_id) {
      const subTask = allSubTasks.find(st => st.id === session.sub_task_id);
      if (subTask) {
        required = subTask.duration_minutes * 60;
      }
    }

    // Calculate percentage (can go over 100% for overtime)
    const percentage = (timeElapsed / required) * 100;
    return Math.min(percentage, 150); // Cap at 150% for display
  };

  const getTargetDuration = (userId: number): number => {
    const userGoal = userGoals.find(ug => ug.user_id === userId);
    if (!userGoal) return 0;

    const session = sessions.find(s => s.user_id === userId && s.date === today);
    let required = userGoal.daily_duration_minutes * 60;
    
    if (session?.sub_task_id) {
      const subTask = allSubTasks.find(st => st.id === session.sub_task_id);
      if (subTask) {
        required = subTask.duration_minutes * 60;
      }
    }

    return required;
  };

  const isOvertime = (userId: number): boolean => {
    const elapsed = timeElapsedByUser[userId];
    if (elapsed === undefined) return false;
    const target = getTargetDuration(userId);
    return elapsed > target;
  };

  const days = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="calendar-container" style={{ 
      minHeight: '100vh', 
      background: theme.background, 
      padding: 'clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem)', 
      transition: 'all 0.3s ease' 
    }}>
      <div className="calendar-main-content" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
            gap: 'clamp(0.75rem, 2vw, 1rem)', 
            marginBottom: 'clamp(1rem, 3vw, 2rem)' 
          }}>
            {summary
              .filter(s => {
                // Hide paused users from summary
                if (!selectedGoalId) return true;
                const userGoal = userGoals.find(ug => ug.user_id === s.user_id && ug.goal_id === selectedGoalId);
                return !userGoal?.is_paused;
              })
              .map(s => {
              const user = users.find(u => u.id === s.user_id);
              
              // Get user initials for avatar fallback
              const getUserInitials = (name: string) => {
                const parts = name.split(' ');
                if (parts.length >= 2) {
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                }
                return name.substring(0, 2).toUpperCase();
              };

              return (
                <div key={s.user_id} style={{
                  background: theme.cardBg,
                  borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease'
                }}>
                  {/* User Header with Avatar */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 'clamp(36px, 8vw, 40px)',
                      height: 'clamp(36px, 8vw, 40px)',
                      borderRadius: '50%',
                      background: !user?.avatar_url ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                      fontWeight: '600',
                      flexShrink: 0,
                      boxShadow: `0 2px 6px ${theme.shadow}`,
                      border: `2px solid ${theme.border}`,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={s.user_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            console.error('Failed to load avatar in summary:', user.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        getUserInitials(s.user_name)
                      )}
                    </div>

                    {/* User Name */}
                    <h3 style={{ 
                      fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
                      fontWeight: '600', 
                      color: theme.text, 
                      margin: 0,
                      wordBreak: 'break-word'
                    }}>
                      {s.user_name}
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: 'clamp(1rem, 4vw, 2rem)',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'clamp(1.5rem, 5vw, 2rem)', 
                        fontWeight: '700', 
                        color: theme.success 
                      }}>
                        {s.total_done} ✅
                      </div>
                      <div style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                        color: theme.textSecondary 
                      }}>
                        Completed
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 'clamp(1.5rem, 5vw, 2rem)', 
                        fontWeight: '700', 
                        color: theme.error 
                      }}>
                        {s.total_missed} ❌
                      </div>
                      <div style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                        color: theme.textSecondary 
                      }}>
                        Missed
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 'clamp(1.5rem, 5vw, 2rem)', 
                        fontWeight: '700', 
                        color: theme.primary 
                      }}>
                        {s.total_hours_worked}h ⏱️
                      </div>
                      <div style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                        color: theme.textSecondary 
                      }}>
                        Total Hours
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: 'clamp(1rem, 3vw, 2rem)' 
        }}
        className="calendar-main-grid"
        >
          <div className="calendar-card" style={{
            background: theme.cardBg,
            borderRadius: 'clamp(1rem, 2.5vw, 1.5rem)',
            boxShadow: `0 10px 15px -3px ${theme.shadow}`,
            padding: 'clamp(1rem, 3vw, 2rem)',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div className="calendar-header" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 'clamp(1rem, 3vw, 2rem)',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <h2 className="calendar-title" style={{ 
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                fontWeight: '600', 
                color: theme.text,
                margin: 0
              }}>
                {monthNames[month]} {year}
              </h2>
              <div className="calendar-header-buttons" style={{ display: 'flex', gap: 'clamp(0.375rem, 1vw, 0.5rem)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(today);
                  }}
                  className="calendar-header-button"
                  style={{
                    padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.875rem, 2.5vw, 1.25rem)',
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    color: theme.text,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.surface}
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1))}
                  className="calendar-header-button"
                  style={{
                    padding: 'clamp(0.5rem, 1.5vw, 0.625rem)',
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: theme.text,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.surface}
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1))}
                  className="calendar-header-button"
                  style={{
                    padding: '0.625rem',
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: theme.text,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.surface}
                >
                  →
                </button>
              </div>
            </div>

            {/* Goal Selector */}
            {userGoals.length > 0 && (
              <div className="goal-selector" style={{ marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <label className="goal-selector-label" style={{
                  display: 'block',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: '600',
                  color: theme.text,
                  marginBottom: '0.5rem'
                }}>
                  📌 Select Goal
                </label>
                <CustomSelect
                  options={Array.from(new Set(userGoals.map(ug => ug.goal_id))).map(goalId => {
                    const goal = userGoals.find(ug => ug.goal_id === goalId);
                    const hours = goal ? Math.round((userGoals.find(ug => ug.goal_id === goalId)?.daily_duration_minutes || 0) / 60 * 10) / 10 : 0;
                    return {
                      id: goalId,
                      name: goal?.goal_title || '',
                      description: `${hours} ${hours === 1 ? 'hr' : 'hrs'} per day`,
                      icon: '🎯'
                    };
                  })}
                  value={selectedGoalId ? {
                    id: selectedGoalId,
                    name: userGoals.find(ug => ug.goal_id === selectedGoalId)?.goal_title || '',
                    description: `${Math.round((userGoals.find(ug => ug.goal_id === selectedGoalId)?.daily_duration_minutes || 0) / 60 * 10) / 10} hrs per day`,
                    icon: '🎯'
                  } : null}
                  onChange={(option) => setSelectedGoalId(Number(option.id))}
                  placeholder="Choose a goal to track"
                />
              </div>
            )}

          <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="calendar-day-header" style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: theme.textSecondary }}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
              }

              const dateStr = formatDateLocal(new Date(year, month, day));
              const isToday = today === dateStr;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className="calendar-day-button"
                  style={{
                    aspectRatio: '1',
                    padding: '0.5rem',
                    borderRadius: '0.75rem',
                    border: isToday ? `2px solid ${theme.primary}` : isSelected ? `2px solid ${theme.success}` : `1px solid ${theme.border}`,
                    background: isSelected ? theme.highlight : theme.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = theme.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = theme.surface;
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isSelected ? theme.success : theme.text }}>{day}</div>
                  {users
                    .filter(user => {
                      // Hide paused users from calendar grid
                      if (!selectedGoalId) return true;
                      const userGoal = userGoals.find(ug => ug.user_id === user.id && ug.goal_id === selectedGoalId);
                      return !userGoal?.is_paused;
                    })
                    .map(user => {
                    const session = getSessionForDate(user.id, dateStr);
                    const optimisticKey = `${user.id}-${dateStr}`;
                    
                    // Only show icon if there's a real session OR optimistic state for this specific date
                    if (!session && !sessionStatusByUser[optimisticKey]) return null;
                    
                    const status = getCurrentSessionStatus(user.id, dateStr, session);
                    return (
                      <div key={user.id} style={{ fontSize: '0.75rem' }}>
                        {status === 'DONE' ? '✅' : status === 'MISSED' ? '❌' : status === 'PAUSED' ? '⏸️' : '⏳'}
                      </div>
                    );
                  })}
                </button>
              );
            })}
          </div>
          </div>

          <div style={{
            background: theme.cardBg,
            borderRadius: '1.5rem',
            boxShadow: `0 10px 15px -3px ${theme.shadow}`,
            padding: '1.5rem',
            border: `1px solid ${theme.border}`,
            maxHeight: '800px',
            overflowY: 'auto',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: theme.text, marginBottom: '0.5rem' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {selectedDate === today ? "📅 Today's Sessions" : 'Selected date'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {users
                .filter(user => {
                  // Only show users who have the selected goal
                  if (!selectedGoalId) return true;
                  const userGoal = userGoals.find(ug => ug.user_id === user.id && ug.goal_id === selectedGoalId);
                  // Hide users who have paused this goal
                  if (userGoal?.is_paused) return false;
                  return userGoals.some(ug => ug.user_id === user.id && ug.goal_id === selectedGoalId);
                })
                .map(user => {
                const userGoal = userGoals.find(ug => ug.user_id === user.id && (!selectedGoalId || ug.goal_id === selectedGoalId));
                const session = getSessionForDate(user.id, selectedDate);
                const showTimer = shouldShowTimer(user.id, selectedDate, session);
                const sessionId = session?.id;
                const timeElapsed = timeElapsedByUser[user.id] || 0;
                const targetDuration = getTargetDuration(user.id);
                const overtime = isOvertime(user.id);
                const currentStatus = getCurrentSessionStatus(user.id, selectedDate, session);
                
                // Get sub-tasks for this user's goal
                const userSubTasks = userGoal ? allSubTasks.filter(st => st.user_goal_id === userGoal.id) : [];
                const currentSubTask = session?.sub_task_id ? allSubTasks.find(st => st.id === session.sub_task_id) : null;

                // Get user initials for avatar fallback
                const getUserInitials = (name: string) => {
                  const parts = name.split(' ');
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase();
                };

                return (
                  <div key={user.id} className="user-goal-card" style={{
                    padding: '1.25rem',
                    background: showTimer ? theme.highlight : theme.surface,
                    borderRadius: '1rem',
                    border: showTimer ? `2px solid ${theme.success}` : `1px solid ${theme.border}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {/* User Header with Avatar */}
                    <div className="user-goal-header" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      {/* Avatar */}
                      <div className="user-avatar" style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: !user.avatar_url ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${theme.shadow}`,
                        border: `2px solid ${theme.border}`,
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              console.error('Failed to load avatar in session card:', user.avatar_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          getUserInitials(user.name)
                        )}
                      </div>

                      {/* User Info */}
                      <div style={{ flex: 1 }}>
                        <h4 className="user-name" style={{ fontSize: '1rem', fontWeight: '600', color: theme.text, marginBottom: '0.25rem' }}>
                          {user.name}
                        </h4>
                        <p className="user-goal-info" style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                          Goal: {userGoal?.daily_duration_hours || 0}h per day
                        </p>
                      </div>
                    </div>

                      {showTimer && (
                        <div className="timer-display" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          padding: '1rem',
                          background: 'rgba(99, 102, 241, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          marginBottom: '1rem'
                        }}>
                          {/* Show current sub-task if tracking one */}
                          {currentSubTask && (
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: theme.primary,
                              marginBottom: '0.5rem',
                              padding: '0.5rem',
                              background: `${theme.primary}15`,
                              borderRadius: '0.5rem',
                              textAlign: 'center'
                            }}>
                              📝 {currentSubTask.title} ({currentSubTask.duration_minutes}min)
                            </div>
                          )}
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              flex: 1
                            }}>
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: currentStatus === 'PAUSED' ? '#f59e0b' : overtime ? '#ef4444' : '#10b981' }}
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              <span className="timer-time" style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                fontFamily: 'monospace',
                                color: currentStatus === 'PAUSED' ? '#f59e0b' : overtime ? '#ef4444' : '#10b981'
                              }}>
                                {formatTime(timeElapsed)}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#64748b',
                              textAlign: 'right',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end'
                            }}>
                              <div style={{ fontWeight: '600' }}>
                                Target: {formatTime(targetDuration)}
                              </div>
                              {overtime && (
                                <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.75rem' }}>
                                  +{formatTime(timeElapsed - targetDuration)} overtime
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: theme.glassBg,
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${getProgressPercentage(user.id)}%`,
                              height: '100%',
                              background: currentStatus === 'PAUSED' ? theme.warning : theme.success,
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>

                          <div style={{
                            fontSize: '0.75rem',
                            color: currentStatus === 'PAUSED' ? theme.warning : overtime ? theme.error : theme.success,
                            textAlign: 'center',
                            fontWeight: '600'
                          }}>
                            {currentStatus === 'PAUSED' ? (
                              <>⏸️ <strong>PAUSED</strong></>
                            ) : overtime ? (
                              <>🔥 <strong>OVERTIME - Keep going!</strong></>
                            ) : (
                              <>⏱️ <strong>IN PROGRESS</strong></>
                            )}
                          </div>

                          <div className="timer-buttons" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {currentStatus === 'IN_PROGRESS' && (
                              <>
                                {/* Show Complete Sub-Task button if tracking a sub-task */}
                                {currentSubTask && (
                                  <button
                                    onClick={() => sessionId && handleCompleteSubTask(sessionId, user.id)}
                                    disabled={!sessionId || !canUserAct(user.id)}
                                    className="timer-button"
                                    style={{
                                      flex: '1 1 100%',
                                      padding: '0.75rem',
                                      background: canUserAct(user.id) ? `linear-gradient(135deg, ${theme.success}, ${theme.primary})` : theme.border,
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.5rem',
                                      cursor: canUserAct(user.id) ? 'pointer' : 'not-allowed',
                                      fontWeight: '700',
                                      fontSize: '0.875rem',
                                      opacity: !canUserAct(user.id) ? 0.5 : 1,
                                      transition: 'all 0.2s ease',
                                      boxShadow: canUserAct(user.id) ? `0 4px 8px ${theme.shadow}` : 'none'
                                    }}
                                  >
                                    {canUserAct(user.id) ? `✅ Complete "${currentSubTask.title}"` : '🔒'}
                                  </button>
                                )}
                                <button
                                  onClick={() => sessionId && handlePauseSession(sessionId, user.id)}
                                  disabled={!sessionId || !canUserAct(user.id)}
                                  className="timer-button"
                                  style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: canUserAct(user.id) ? theme.warning : theme.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: canUserAct(user.id) ? 'pointer' : 'not-allowed',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    opacity: !canUserAct(user.id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {canUserAct(user.id) ? '⏸️ Pause' : '🔒'}
                                </button>
                                <button
                                  onClick={() => sessionId && handleStopSession(sessionId, user.id)}
                                  disabled={!sessionId || !canUserAct(user.id)}
                                  className="timer-button"
                                  style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: canUserAct(user.id) ? theme.error : theme.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: canUserAct(user.id) ? 'pointer' : 'not-allowed',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    opacity: !canUserAct(user.id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {canUserAct(user.id) ? '⏹️ Stop' : '🔒'}
                                </button>
                              </>
                            )}
                            {currentStatus === 'PAUSED' && (
                              <>
                                <button
                                  onClick={() => sessionId && handleResumeSession(sessionId, user.id)}
                                  disabled={!sessionId || !canUserAct(user.id)}
                                  className="timer-button"
                                  style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: canUserAct(user.id) ? theme.success : theme.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: canUserAct(user.id) ? 'pointer' : 'not-allowed',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    opacity: !canUserAct(user.id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {canUserAct(user.id) ? '▶️ Resume' : '🔒'}
                                </button>
                                <button
                                  onClick={() => sessionId && handleStopSession(sessionId, user.id)}
                                  disabled={!sessionId || !canUserAct(user.id)}
                                  className="timer-button"
                                  style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: canUserAct(user.id) ? theme.error : theme.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: canUserAct(user.id) ? 'pointer' : 'not-allowed',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    opacity: !canUserAct(user.id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {canUserAct(user.id) ? '⏹️ Stop' : '🔒'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {session && !showTimer && (session.status === 'DONE' || session.status === 'MISSED') && (
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          padding: '1rem',
                          background: session.status === 'DONE' ? theme.highlight : 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '0.75rem',
                          color: session.status === 'DONE' ? theme.success : theme.error,
                          transition: 'all 0.3s ease'
                        }}>
                          {session.status === 'DONE' ? '✅ DONE' : '❌ MISSED'}
                        </div>
                      )}

                      {!session && !showTimer && (
                        <div>
                          {/* Sub-task selection - REQUIRED if sub-tasks exist */}
                          {userSubTasks.length > 0 ? (
                            <div className="sub-task-selector" style={{ marginBottom: '1rem' }}>
                              <label className="sub-task-label" style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: theme.text,
                                marginBottom: '0.5rem'
                              }}>
                                Select Task to Start
                              </label>
                              <CustomSelect
                                options={userSubTasks.map(st => ({
                                  id: st.id,
                                  name: st.title,
                                  description: `${st.duration_minutes} minutes`,
                                  icon: '📝'
                                }))}
                                value={selectedSubTaskByUser[user.id] ? {
                                  id: selectedSubTaskByUser[user.id]!,
                                  name: userSubTasks.find(st => st.id === selectedSubTaskByUser[user.id])?.title || '',
                                  description: `${userSubTasks.find(st => st.id === selectedSubTaskByUser[user.id])?.duration_minutes || 0} minutes`,
                                  icon: '📝'
                                } : null}
                                onChange={(option) => {
                                  setSelectedSubTaskByUser(prev => ({
                                    ...prev,
                                    [user.id]: Number(option.id)
                                  }));
                                }}
                                placeholder="Choose a task to start"
                              />
                            </div>
                          ) : (
                            // No sub-tasks available - show info message
                            <div style={{
                              padding: '0.75rem',
                              background: theme.highlight,
                              borderRadius: '0.5rem',
                              marginBottom: '1rem',
                              border: `1px solid ${theme.border}`
                            }}>
                              <p style={{
                                fontSize: '0.875rem',
                                color: theme.text,
                                margin: 0,
                                textAlign: 'center'
                              }}>
                                🎯 Ready to start the full goal session
                              </p>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              const subTaskId = userSubTasks.length > 0 ? selectedSubTaskByUser[user.id] || undefined : undefined;
                              
                              // If sub-tasks exist but none selected, show error
                              if (userSubTasks.length > 0 && !subTaskId) {
                                toast.error('Please select a task to start');
                                return;
                              }
                              
                              handleStartSession(user.id, subTaskId);
                            }}
                            disabled={selectedDate !== today || !canUserAct(user.id)}
                            className="start-button"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: selectedDate === today && canUserAct(user.id) ? theme.success : theme.border,
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: selectedDate === today && canUserAct(user.id) ? 'pointer' : 'not-allowed',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              opacity: !canUserAct(user.id) ? 0.5 : 1
                            }}
                          >
                            {!canUserAct(user.id) 
                              ? '🔒 Not your session' 
                              : selectedDate === today 
                                ? userSubTasks.length > 0 
                                  ? '▶️ Start Selected Task'
                                  : '▶️ Start Goal Session'
                                : 'Can only start today'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (min-width: 1024px) {
          .calendar-main-grid {
            grid-template-columns: 1fr 400px !important;
          }
        }
        
        @media (max-width: 768px) {
          .calendar-main-grid {
            gap: 1rem !important;
          }
          
          .calendar-days-grid {
            grid-template-columns: repeat(7, 1fr) !important;
            gap: 0.25rem !important;
          }
          
          .calendar-day-button {
            padding: 0.25rem !important;
            font-size: 0.75rem !important;
            min-height: 40px !important;
          }
          
          .calendar-header-buttons {
            gap: 0.25rem !important;
          }
          
          .calendar-header-button {
            padding: 0.5rem !important;
            font-size: 0.875rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .calendar-main-grid {
            gap: 0.75rem !important;
          }
          
          .calendar-days-grid {
            gap: 0.125rem !important;
          }
          
          .calendar-day-button {
            padding: 0.125rem !important;
            font-size: 0.625rem !important;
            min-height: 35px !important;
          }
          
          .calendar-header-buttons {
            gap: 0.125rem !important;
          }
          
          .calendar-header-button {
            padding: 0.375rem !important;
            font-size: 0.75rem !important;
          }
          
          .user-goal-card {
            padding: 0.75rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .user-goal-header {
            gap: 0.5rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .user-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.75rem !important;
          }
          
          .timer-display {
            padding: 0.75rem !important;
          }
          
          .timer-buttons {
            gap: 0.25rem !important;
          }
          
          .timer-button {
            padding: 0.5rem !important;
            font-size: 0.75rem !important;
          }
        }
        
        @media (max-width: 320px) {
          .calendar-container {
            padding: 0.5rem 0.25rem !important;
          }
          
          .calendar-main-content {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .calendar-card {
            padding: 0.75rem !important;
            border-radius: 0.5rem !important;
          }
          
          .calendar-header {
            margin-bottom: 0.75rem !important;
            gap: 0.25rem !important;
          }
          
          .calendar-title {
            font-size: 1rem !important;
          }
          
          .calendar-days-grid {
            gap: 0.0625rem !important;
          }
          
          .calendar-day-button {
            padding: 0.0625rem !important;
            font-size: 0.5rem !important;
            min-height: 30px !important;
            border-radius: 0.25rem !important;
          }
          
          .calendar-day-header {
            padding: 0.25rem !important;
            font-size: 0.625rem !important;
          }
          
          .goal-selector {
            margin-bottom: 0.75rem !important;
          }
          
          .goal-selector-label {
            font-size: 0.75rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          .goal-selector-dropdown {
            padding: 0.5rem !important;
            font-size: 0.75rem !important;
            min-height: 2.25rem !important;
            max-height: 2.75rem !important;
          }
          
          .custom-select-container {
            min-width: auto !important;
          }
          
          .custom-select-button {
            padding: 0.5rem 0.75rem !important;
            min-height: 2.5rem !important;
            gap: 0.5rem !important;
          }
          
          .custom-select-text {
            font-size: 0.8125rem !important;
            line-height: 1.2 !important;
          }
          
          .custom-select-icon {
            font-size: 0.875rem !important;
          }
          
          .custom-select-chevron {
            width: 0.625rem !important;
            height: 0.625rem !important;
          }
          
          .user-goal-card {
            padding: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            border-radius: 0.5rem !important;
          }
          
          .user-goal-header {
            gap: 0.375rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .user-avatar {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.625rem !important;
          }
          
          .user-name {
            font-size: 0.875rem !important;
          }
          
          .user-goal-info {
            font-size: 0.625rem !important;
          }
          
          .timer-display {
            padding: 0.5rem !important;
            border-radius: 0.5rem !important;
          }
          
          .timer-time {
            font-size: 1.25rem !important;
          }
          
          .timer-buttons {
            gap: 0.125rem !important;
            margin-top: 0.25rem !important;
          }
          
          .timer-button {
            padding: 0.375rem !important;
            font-size: 0.625rem !important;
            border-radius: 0.25rem !important;
          }
          
          .start-button {
            padding: 0.5rem !important;
            font-size: 0.75rem !important;
          }
          
          .sub-task-selector {
            margin-bottom: 0.5rem !important;
          }
          
          .sub-task-label {
            font-size: 0.75rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          .sub-task-dropdown {
            padding: 0.375rem !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GameCalendar;
