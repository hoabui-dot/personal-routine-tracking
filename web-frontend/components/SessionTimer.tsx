import React, { useState, useEffect } from 'react';
import { Session } from '../types/Session';

interface SessionTimerProps {
  activeSession: Session | null;
  totalHours: number; // Total accumulated hours from previous sessions
  targetHours: number; // Target hours for the sub-goal
}

const SessionTimer: React.FC<SessionTimerProps> = ({
  activeSession,
  totalHours,
  targetHours,
}) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const updateTimer = () => {
      let currentSessionTime = 0;

      if (activeSession) {
        // Calculate elapsed time since session started
        const startTime = new Date(activeSession.started_at).getTime();
        const now = Date.now();
        const elapsedMs = now - startTime;
        currentSessionTime = elapsedMs / (1000 * 60 * 60); // Convert to hours
      }

      // Calculate total time spent (accumulated + current session)
      const totalTimeSpent = totalHours + currentSessionTime;

      // Calculate remaining time (target - spent)
      const timeRemaining = Math.max(0, targetHours - totalTimeSpent);

      // Debug logging
      console.log('Countdown Timer Debug:', {
        totalHours,
        currentSessionTime,
        totalTimeSpent,
        targetHours,
        timeRemaining,
        activeSession: !!activeSession
      });

      setRemainingTime(timeRemaining);
    };

    // Update immediately
    updateTimer();

    // Update every second if there's an active session
    if (activeSession) {
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeSession, totalHours, targetHours]);

  // Format time as HH:MM:SS for countdown
  const formatCountdownTime = (hours: number): string => {
    // Ensure we have a valid number
    const validHours = isNaN(hours) || hours < 0 ? 0 : hours;

    const totalSeconds = Math.floor(validHours * 3600);
    const displayHours = Math.floor(totalSeconds / 3600);
    const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
    const displaySecondsRem = totalSeconds % 60;

    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes
      .toString()
      .padStart(2, '0')}:${displaySecondsRem.toString().padStart(2, '0')}`;
  };

  // Check if target is completed or exceeded
  const isCompleted = remainingTime <= 0;
  const totalTimeSpent = targetHours - remainingTime;

  // Calculate progress percentage (based on time spent, not remaining)
  const progressPercentage = Math.min((totalTimeSpent / targetHours) * 100, 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Timer Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: isCompleted ? '#ef4444' : (activeSession ? '#10b981' : '#6b7280') }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              color: isCompleted ? '#ef4444' : (activeSession ? '#10b981' : '#e5e7eb'),
            }}
          >
            {formatCountdownTime(remainingTime)}
          </span>
        </div>

        <div
          style={{
            fontSize: '0.875rem',
            color: '#9ca3af',
            textAlign: 'right',
          }}
        >
          {isCompleted ? '🎉 COMPLETED!' : 'remaining'}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: isCompleted ? '#ef4444' : (activeSession ? '#10b981' : '#6366f1'),
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status Text */}
      <div
        style={{
          fontSize: '0.75rem',
          color: isCompleted ? '#ef4444' : (activeSession ? '#10b981' : '#9ca3af'),
          textAlign: 'center',
        }}
      >
        {isCompleted ? (
          <>
            🎉 <strong>TARGET ACHIEVED!</strong> • Progress: {progressPercentage.toFixed(1)}%
            <br />
            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
              Total time spent: {formatCountdownTime(totalTimeSpent)} / {formatCountdownTime(targetHours)}
            </span>
          </>
        ) : activeSession ? (
          <>
            ⏱️ <strong>COUNTDOWN ACTIVE</strong> • Started at{' '}
            {new Date(activeSession.started_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
            <br />
            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
              Progress: {progressPercentage.toFixed(1)}% • Spent: {formatCountdownTime(totalTimeSpent)} / {formatCountdownTime(targetHours)}
            </span>
          </>
        ) : (
          <>
            ⏸️ Session paused • Progress: {progressPercentage.toFixed(1)}%
            <br />
            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
              Time remaining: {formatCountdownTime(remainingTime)} • Spent: {formatCountdownTime(totalTimeSpent)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionTimer;
