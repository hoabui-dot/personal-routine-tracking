import React from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { Goal } from '../types/Goal';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const { theme } = useTheme();

  return (
    <Link href={`/goals/${goal.id}`}>
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 6px -1px ${theme.shadow}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 25px -5px ${theme.shadow}`;
          e.currentTarget.style.background = theme.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 4px 6px -1px ${theme.shadow}`;
          e.currentTarget.style.background = theme.surface;
        }}
      >
        {/* Goal Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Goal Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '8px',
              lineHeight: '1.4',
            }}
          >
            {goal.title}
          </h3>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <svg
              width="16"
              height="16"
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
            <span
              style={{
                fontSize: '0.875rem',
                color: theme.textSecondary,
                fontWeight: '500',
              }}
            >
              {goal.year}
            </span>
          </div>
        </div>

        {/* Goal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: theme.textSecondary,
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: '0.05em',
            }}
          >
            View Details
          </span>
          
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default GoalCard;
