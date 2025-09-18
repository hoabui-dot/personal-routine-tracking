import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SubGoal } from '../types/SubGoal';
import SessionTimer from './SessionTimer';

interface SubGoalCardProps {
  subGoal: SubGoal & { total_hours?: string | number; target_hours?: number };
  onStartSession: (subGoalId: number) => void;
  onStopSession: (subGoalId: number) => void;
  onEdit: (subGoal: SubGoal) => void;
  onDelete: (subGoalId: number) => void;
  activeSessionId?: number;
  activeSession?: any; // Session object if active
}

const SubGoalCard: React.FC<SubGoalCardProps> = ({
  subGoal,
  onStartSession,
  onStopSession,
  onEdit,
  onDelete,
  activeSessionId,
  activeSession,
}) => {
  const { theme } = useTheme();

  const isActive = !!activeSessionId; // If there's an activeSessionId, session is active
  const totalHours = parseFloat(String(subGoal.total_hours || '0'));
  const targetHours = parseFloat(String(subGoal.target_hours || '0'));
  const isCompleted = totalHours >= targetHours;
  const progressPercentage = targetHours > 0 ? Math.min((totalHours / targetHours) * 100, 100) : 0;

  const formatDate = (dateString: string) => {
    // dateString is in DD/MM format, just return as is
    return dateString;
  };

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '24px',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 6px -1px ${theme.shadow}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '8px',
              lineHeight: '1.4',
            }}
          >
            {subGoal.title}
          </h3>
          
          {subGoal.description && (
            <p
              style={{
                fontSize: '0.875rem',
                color: theme.textSecondary,
                marginBottom: '12px',
                lineHeight: '1.5',
              }}
            >
              {subGoal.description}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: isCompleted 
              ? `${theme.success}20` 
              : isActive 
                ? `${theme.primary}20` 
                : `${theme.textSecondary}20`,
            color: isCompleted 
              ? theme.success 
              : isActive 
                ? theme.primary 
                : theme.textSecondary,
          }}
        >
          {isCompleted ? '✅ Done' : isActive ? '⏱️ Active' : '⏸️ Paused'}
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: theme.textSecondary, fontWeight: '500' }}>
            Progress
          </span>
          <span style={{ fontSize: '0.875rem', color: theme.text, fontWeight: '600' }}>
            {totalHours.toFixed(1)}h / {targetHours}h
          </span>
        </div>
        
        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: `${theme.textSecondary}20`,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: isCompleted 
                ? `linear-gradient(90deg, ${theme.success}, ${theme.success}dd)` 
                : `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Session Timer */}
      {!isCompleted && (
        <div style={{ marginBottom: '16px' }}>
          <SessionTimer
            activeSession={activeSession || null}
            totalHours={totalHours}
            targetHours={targetHours}
          />
        </div>
      )}

      {/* Date Range */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          padding: '8px 12px',
          background: `${theme.textSecondary}10`,
          borderRadius: '8px',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.textSecondary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ fontSize: '0.75rem', color: theme.textSecondary, fontWeight: '500' }}>
          {formatDate(subGoal.start_date)} - {formatDate(subGoal.end_date)}
        </span>
      </div>

      {/* Actions */}
      {isCompleted ? (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            background: `${theme.success}15`,
            borderRadius: '12px',
            border: `1px solid ${theme.success}30`,
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: theme.success,
            }}
          >
            COMPLETED!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          {isActive ? (
            <button
              onClick={() => onStopSession(subGoal.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: theme.error,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.error}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Stop Session
            </button>
          ) : (
            <button
              onClick={() => onStartSession(subGoal.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: theme.success,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.success}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Start Session
            </button>
          )}

          {/* Edit/Delete buttons */}
          <button
            onClick={() => onEdit(subGoal)}
            style={{
              padding: '12px',
              background: theme.glassBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.glassHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.glassBg;
            }}
          >
            <svg width="14" height="14" stroke={theme.text} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(subGoal.id)}
            style={{
              padding: '12px',
              background: `${theme.error}15`,
              border: `1px solid ${theme.error}30`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${theme.error}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${theme.error}15`;
            }}
          >
            <svg width="14" height="14" stroke={theme.error} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default SubGoalCard;
