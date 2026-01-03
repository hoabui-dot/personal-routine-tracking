import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gameApi } from '../lib/api/game';
import { User, UserGoal, DailySession, GameSummary } from '../types/game';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
  const [timeRemainingByUser, setTimeRemainingByUser] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const toast = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Format date to local YYYY-MM-DD
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  console.log('Today (local):', today);
  console.log('Selected date:', selectedDate);
  console.log('Current date:', currentDate);

  const loadData = useCallback(async () => {
    try {
      const [usersData, goalsData, summaryData] = await Promise.all([
        gameApi.getUsers(),
        gameApi.getUserGoals(),
        gameApi.getSummary(),
      ]);
      
      setUsers(usersData);
      setUserGoals(goalsData);
      setSummary(summaryData);

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
  }, [year, month, toast]);

  const initializeApp = useCallback(async () => {
    if (initialized) return;
    
    try {
      const result = await gameApi.checkAndCleanup();
      
      if (result.cleanedUp > 0) {
        toast.info(`${result.cleanedUp} session(s) from previous days marked as MISSED`);
      }
      
      const goals = await gameApi.getUserGoals();
      const newTimeRemaining: Record<number, number> = {};
      
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
              
              const required = userGoal.daily_duration_minutes * 60;
              const remaining = Math.max(0, required - activeElapsed);
              newTimeRemaining[session.user_id] = remaining;
            }
          }
        });
      }
      
      setTimeRemainingByUser(newTimeRemaining);
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
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (activeSessions.length === 0) {
      return;
    }

    const handleComplete = async (sessionId: number, userId: number) => {
      try {
        await gameApi.completeSession(sessionId);
        setTimeRemainingByUser(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        await loadData();
        toast.success('Session completed! ✅');
      } catch (error: any) {
        console.error('[GameCalendar Error] Failed to complete session:', {
          sessionId,
          userId,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
          } : error,
        });
      }
    };

    const updateTimers = () => {
      const newTimeRemaining: Record<number, number> = {};
      
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
        
        const required = userGoal.daily_duration_minutes * 60;
        const remaining = Math.max(0, required - activeElapsed);

        newTimeRemaining[session.user_id] = remaining;

        if (remaining === 0 && session.status === 'IN_PROGRESS') {
          handleComplete(session.id, session.user_id);
        }
      });
      
      setTimeRemainingByUser(newTimeRemaining);
    };

    updateTimers();

    const inProgressSessions = activeSessions.filter(s => s.status === 'IN_PROGRESS');
    if (inProgressSessions.length > 0) {
      timerIntervalRef.current = setInterval(updateTimers, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [sessions, today, userGoals, loadData, toast]);

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
      targetUserId,
      canAct
    });
    
    // Check if the logged-in user's ID matches the target user ID
    return canAct;
  };

  const handleStartSession = async (userId: number) => {
    if (!selectedDate) return;
    
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    setLoading(true);
    try {
      const userGoal = userGoals.find(ug => ug.user_id === userId);
      const goalId = userGoal?.goal_id;
      if (!goalId) throw new Error('Goal not found');

      await gameApi.startSession(userId, goalId, selectedDate);
      
      if (userGoal) {
        const initialTime = userGoal.daily_duration_minutes * 60;
        setTimeRemainingByUser(prev => ({
          ...prev,
          [userId]: initialTime
        }));
      }
      
      await loadData();
      toast.success('Session started!');
    } catch (error: any) {
      console.error('[GameCalendar Error] Failed to start session:', {
        userId,
        selectedDate,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async (sessionId: number, userId: number) => {
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
    
    setLoading(true);
    try {
      await gameApi.stopSession(sessionId);
      setTimeRemainingByUser(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      await loadData();
      toast.success('Session stopped');
    } catch (error: any) {
      console.error('[GameCalendar Error] Failed to stop session:', {
        sessionId,
        userId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error.message || 'Failed to stop session');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSession = async (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    setLoading(true);
    try {
      await gameApi.pauseSession(sessionId);
      await loadData();
      toast.success('Session paused');
    } catch (error: any) {
      console.error('[GameCalendar Error] Failed to pause session:', {
        sessionId,
        userId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error.message || 'Failed to pause session');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async (sessionId: number, userId: number) => {
    // Check permission
    if (!canUserAct(userId)) {
      toast.error('You can only manage your own sessions');
      return;
    }
    
    setLoading(true);
    try {
      await gameApi.resumeSession(sessionId);
      await loadData();
      toast.success('Session resumed');
    } catch (error: any) {
      console.error('[GameCalendar Error] Failed to resume session:', {
        sessionId,
        userId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error.message || 'Failed to resume session');
    } finally {
      setLoading(false);
    }
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (userId: number) => {
    const timeRemaining = timeRemainingByUser[userId];
    if (timeRemaining === undefined) return 0;
    
    const userGoal = userGoals.find(ug => ug.user_id === userId);
    if (!userGoal) return 0;

    const required = userGoal.daily_duration_minutes * 60;
    const elapsed = required - timeRemaining;
    return Math.min((elapsed / required) * 100, 100);
  };

  const days = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.background, 
      padding: 'clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem)', 
      transition: 'all 0.3s ease' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
            gap: 'clamp(0.75rem, 2vw, 1rem)', 
            marginBottom: 'clamp(1rem, 3vw, 2rem)' 
          }}>
            {summary.map(s => {
              const user = users.find(u => (u.user_id as string) === (s.user_id as unknown as string));
              
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
          <div style={{
            background: theme.cardBg,
            borderRadius: 'clamp(1rem, 2.5vw, 1.5rem)',
            boxShadow: `0 10px 15px -3px ${theme.shadow}`,
            padding: 'clamp(1rem, 3vw, 2rem)',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 'clamp(1rem, 3vw, 2rem)',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                fontWeight: '600', 
                color: theme.text,
                margin: 0
              }}>
                {monthNames[month]} {year}
              </h2>
              <div style={{ display: 'flex', gap: 'clamp(0.375rem, 1vw, 0.5rem)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(today);
                  }}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: theme.textSecondary }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
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
                  {users.map(user => {
                    const session = getSessionForDate(user.id, dateStr);
                    if (!session) return null;
                    return (
                      <div key={user.id} style={{ fontSize: '0.75rem' }}>
                        {session.status === 'DONE' ? '✅' : session.status === 'MISSED' ? '❌' : session.status === 'PAUSED' ? '⏸️' : '⏳'}
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
              {users.map(user => {
                const userGoal = userGoals.find(ug => ug.user_id === user.id);
                const session = getSessionForDate(user.id, selectedDate);
                const showTimer = session && (session.status === 'IN_PROGRESS' || session.status === 'PAUSED');
                const sessionId = session?.id;
                const timeRemaining = timeRemainingByUser[user.id] || 0;

                // Get user initials for avatar fallback
                const getUserInitials = (name: string) => {
                  const parts = name.split(' ');
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase();
                };

                return (
                  <div key={user.id} style={{
                    padding: '1.25rem',
                    background: showTimer ? theme.highlight : theme.surface,
                    borderRadius: '1rem',
                    border: showTimer ? `2px solid ${theme.success}` : `1px solid ${theme.border}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {/* User Header with Avatar */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      {/* Avatar */}
                      <div style={{
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
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: theme.text, marginBottom: '0.25rem' }}>
                          {user.name}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                          Goal: {userGoal?.daily_duration_hours || 0}h per day
                        </p>
                      </div>
                    </div>

                      {showTimer && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          padding: '1rem',
                          background: 'rgba(99, 102, 241, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
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
                                style={{ color: session?.status === 'PAUSED' ? '#f59e0b' : '#10b981' }}
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              <span style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                fontFamily: 'monospace',
                                color: session?.status === 'PAUSED' ? '#f59e0b' : '#10b981'
                              }}>
                                {formatTime(timeRemaining)}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              textAlign: 'right'
                            }}>
                              remaining
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
                              background: session?.status === 'PAUSED' ? theme.warning : theme.success,
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>

                          <div style={{
                            fontSize: '0.75rem',
                            color: session?.status === 'PAUSED' ? theme.warning : theme.success,
                            textAlign: 'center'
                          }}>
                            {session?.status === 'PAUSED' ? (
                              <>⏸️ <strong>PAUSED</strong></>
                            ) : (
                              <>⏱️ <strong>COUNTING DOWN</strong></>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {session?.status === 'IN_PROGRESS' && (
                              <>
                                <button
                                  onClick={() => sessionId && handlePauseSession(sessionId, user.id)}
                                  disabled={loading || !sessionId || !canUserAct(user.id)}
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
                                  disabled={loading || !sessionId || !canUserAct(user.id)}
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
                            {session?.status === 'PAUSED' && (
                              <>
                                <button
                                  onClick={() => sessionId && handleResumeSession(sessionId, user.id)}
                                  disabled={loading || !sessionId || !canUserAct(user.id)}
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
                                  disabled={loading || !sessionId || !canUserAct(user.id)}
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

                      {session && (session.status === 'DONE' || session.status === 'MISSED') && (
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

                      {!session && (
                        <button
                          onClick={() => handleStartSession(user.id)}
                          disabled={loading || selectedDate !== today || !canUserAct(user.id)}
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
                              ? '▶️ Start' 
                              : 'Can only start today'}
                        </button>
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
        }
      `}</style>
    </div>
  );
};

export default GameCalendar;
