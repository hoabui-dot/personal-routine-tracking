import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = React.useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match animation duration
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.duration, handleDismiss]);

  const getToastStyles = () => {
    const baseStyles = {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      borderRadius: '0.75rem',
      padding: '1rem 1.25rem',
      marginBottom: '0.75rem',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isLeaving ? '1' : '0',
      transition: 'all 0.3s ease-in-out',
      cursor: toast.dismissible !== false ? 'pointer' : 'default',
      minWidth: '320px',
      maxWidth: '400px',
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          borderLeftColor: '#22c55e',
          borderLeftWidth: '4px',
        };
      case 'error':
        return {
          ...baseStyles,
          borderLeftColor: '#ef4444',
          borderLeftWidth: '4px',
        };
      case 'warning':
        return {
          ...baseStyles,
          borderLeftColor: '#f59e0b',
          borderLeftWidth: '4px',
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          borderLeftColor: '#3b82f6',
          borderLeftWidth: '4px',
        };
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      style={getToastStyles()}
      onClick={toast.dismissible !== false ? handleDismiss : undefined}
    >
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
      >
        <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>{getIcon()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: toast.message ? '0.25rem' : 0,
            }}
          >
            {toast.title}
          </div>
          {toast.message && (
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.4',
              }}
            >
              {toast.message}
            </div>
          )}
        </div>
        {toast.dismissible !== false && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleDismiss();
            }}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              transition: 'color 0.15s ease-in-out',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#6b7280';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};

export default ToastItem;
