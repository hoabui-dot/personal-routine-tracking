import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { gameApi } from '../lib/api/game';
import { GoalSubTask } from '../types/game';

/**
 * FloatingTimerPopup - A mini-player style floating timer
 * 
 * Design inspiration: Spotify mini player, Google Meet floating controls
 * 
 * Features:
 * - Fixed position at bottom-right corner
 * - Compact, card-like design with elevation
 * - Clear visual indication of running state
 * - Pause/Resume controls
 * - Navigate to calendar button
 */
export const FloatingTimerPopup: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { 
    timeElapsedByUser, 
    sessionStatusByUser, 
    pauseTimer, 
    resumeTimer, 
    isInitialized 
  } = useTimer();
  
  const [currentSubTask, setCurrentSubTask] = useState<GoalSubTask | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetDuration, setTargetDuration] = useState<number>(0);

  // Check if we're on the calendar page
  const isOnCalendarPage = router.pathname === '/calendar';

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Get current status from TimerContext (single source of truth)
  const statusKey = authUser ? `${authUser.id}-${today}` : '';
  const currentStatus = sessionStatusByUser[statusKey];
  const timeElapsed = timeElapsedByUser[authUser?.id || 0] || 0;

  // Fetch sub-task details when we have an active session
  const fetchSessionDetails = useCallback(async () => {
    if (!authUser || !isInitialized) return;

    try {
      const sessions = await gameApi.getSessions({ 
        userId: authUser.id, 
        date: today 
      });
      
      // Find the active session (IN_PROGRESS)
      const active = sessions.find(s => s.status === 'IN_PROGRESS');
      
      if (active) {
        setSessionId(active.id || null);
        
        // Fetch sub-task details if session has one
        if (active.sub_task_id) {
          const subTasks = await gameApi.getGoalSubTasks();
          const subTask = subTasks.find(st => st.id === active.sub_task_id);
          setCurrentSubTask(subTask || null);
          setTargetDuration(subTask?.duration_minutes || 0);
        } else {
          setCurrentSubTask(null);
          setTargetDuration(0);
        }
      } else {
        setSessionId(null);
        setCurrentSubTask(null);
        setTargetDuration(0);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    }
  }, [authUser, today, isInitialized]);

  useEffect(() => {
    fetchSessionDetails();

    // Refresh every 10 seconds to stay in sync
    const interval = setInterval(fetchSessionDetails, 10000);
    return () => clearInterval(interval);
  }, [fetchSessionDetails]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    if (targetDuration <= 0) return 0;
    const targetSeconds = targetDuration * 60;
    return Math.min((timeElapsed / targetSeconds) * 100, 100);
  };

  const handlePause = async () => {
    if (!sessionId || !authUser) return;
    setIsLoading(true);
    try {
      pauseTimer(authUser.id, today);
      await gameApi.pauseSession(sessionId);
    } catch (error) {
      console.error('Failed to pause session:', error);
      resumeTimer(authUser.id, today);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToCalendar = () => {
    router.push('/calendar');
  };

  // Visibility conditions - MUST show when timer is running
  const shouldShow = 
    isInitialized &&
    authUser &&
    !isOnCalendarPage &&
    currentStatus === 'IN_PROGRESS';

  // Debug logging
  useEffect(() => {
    console.log('🎯 FloatingTimerPopup visibility check:', {
      isInitialized,
      hasAuthUser: !!authUser,
      isOnCalendarPage,
      currentStatus,
      statusKey,
      shouldShow,
      timeElapsed,
      sessionId
    });
  }, [isInitialized, authUser, isOnCalendarPage, currentStatus, statusKey, shouldShow, timeElapsed, sessionId]);

  if (!shouldShow) {
    return null;
  }

  const progress = getProgress();

  return (
    <>
      {/* Floating Timer Popup - Fixed Position Overlay */}
      <div
        id="floating-timer-popup"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '300px',
          pointerEvents: 'auto',
        }}
        role="dialog"
        aria-label="Active timer"
        aria-live="polite"
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            animation: 'slideUpFade 0.3s ease-out',
          }}
        >
          {/* Progress bar at top */}
          <div
            style={{
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                transition: 'width 1s linear',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {/* Header with status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Pulsing indicator */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#22c55e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Timer Running
                </span>
              </div>
              
              {/* Close/Navigate button */}
              <button
                onClick={handleGoToCalendar}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                aria-label="Go to calendar"
                title="Go to calendar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            </div>

            {/* Sub-task name */}
            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f1f5f9',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={currentSubTask?.title || 'Focus Session'}
              >
                {currentSubTask?.title || 'Focus Session'}
              </h3>
              {targetDuration > 0 && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: '4px 0 0 0',
                  }}
                >
                  Target: {targetDuration} min
                </p>
              )}
            </div>

            {/* Timer display - LARGE and prominent */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '2px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                {formatTime(timeElapsed)}
              </div>
              {targetDuration > 0 && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '8px',
                  }}
                >
                  {Math.round(progress)}% complete
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Pause button */}
              <button
                onClick={handlePause}
                disabled={isLoading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 179, 8, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.3)';
                }}
                aria-label="Pause timer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span>Pause</span>
              </button>

              {/* Calendar button */}
              <button
                onClick={handleGoToCalendar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                aria-label="Open calendar"
                title="Open calendar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
};
