import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CapybaraIcon from './CapybaraIcon';

interface CapybaraEmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const CapybaraEmptyState: React.FC<CapybaraEmptyStateProps> = ({ 
  title, 
  message,
  actionText,
  onAction 
}) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme.surface,
        border: `2px dashed ${theme.border}`,
        borderRadius: '1.5rem',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          ${theme.primary},
          ${theme.primary} 10px,
          transparent 10px,
          transparent 20px
        )`
      }} />

      {/* Capybara Icon */}
      <div style={{
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}20)`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem',
        position: 'relative',
        animation: 'gentleBounce 3s ease-in-out infinite'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: `linear-gradient(135deg, ${theme.primary}30, ${theme.accent}30)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CapybaraIcon size={64} />
        </div>
      </div>

      {/* Content */}
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: theme.text,
          marginBottom: '0.75rem',
          position: 'relative'
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: theme.textSecondary,
          fontSize: '1rem',
          marginBottom: actionText ? '2rem' : 0,
          maxWidth: '400px',
          margin: '0 auto',
          lineHeight: '1.6',
          position: 'relative'
        }}
      >
        {message}
      </p>

      {/* Action Button */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '2rem',
            padding: '0.875rem 2rem',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${theme.shadow}`,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 16px ${theme.shadow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadow}`;
          }}
        >
          {actionText}
        </button>
      )}

      <style jsx>{`
        @keyframes gentleBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default CapybaraEmptyState;
