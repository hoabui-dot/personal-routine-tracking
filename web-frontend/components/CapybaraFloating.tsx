import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CapybaraFloatingProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
}

const CapybaraFloating: React.FC<CapybaraFloatingProps> = ({ 
  position = 'bottom-right',
  size = 120 
}) => {
  const { theme } = useTheme();

  const positions = {
    'top-left': { top: '2rem', left: '2rem' },
    'top-right': { top: '2rem', right: '2rem' },
    'bottom-left': { bottom: '2rem', left: '2rem' },
    'bottom-right': { bottom: '2rem', right: '2rem' },
  };

  return (
    <div style={{
      position: 'fixed',
      ...positions[position],
      opacity: 0.12,
      pointerEvents: 'none',
      zIndex: 0,
      animation: 'float 6s ease-in-out infinite',
      transition: 'opacity 0.3s ease'
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Relaxed Capybara */}
        {/* Body */}
        <ellipse cx="60" cy="75" rx="40" ry="30" fill={theme.accent} opacity="0.7" />
        
        {/* Head */}
        <ellipse cx="60" cy="45" rx="28" ry="25" fill={theme.primary} opacity="0.7" />
        
        {/* Ears */}
        <ellipse cx="45" cy="28" rx="7" ry="10" fill={theme.accent} opacity="0.7" />
        <ellipse cx="75" cy="28" rx="7" ry="10" fill={theme.accent} opacity="0.7" />
        
        {/* Eyes - closed/relaxed */}
        <path
          d="M 50 42 Q 52 44 54 42"
          stroke={theme.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 66 42 Q 68 44 70 42"
          stroke={theme.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        
        {/* Nose */}
        <ellipse cx="60" cy="52" rx="5" ry="3" fill={theme.text} opacity="0.5" />
        
        {/* Happy smile */}
        <path
          d="M 52 58 Q 60 62 68 58"
          stroke={theme.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        
        {/* Legs */}
        <ellipse cx="45" cy="98" rx="7" ry="12" fill={theme.accent} opacity="0.7" />
        <ellipse cx="60" cy="100" rx="7" ry="12" fill={theme.accent} opacity="0.7" />
        <ellipse cx="75" cy="98" rx="7" ry="12" fill={theme.accent} opacity="0.7" />
        
        {/* Water ripples */}
        <ellipse cx="60" cy="105" rx="35" ry="8" fill={theme.primary} opacity="0.2" />
        <ellipse cx="60" cy="108" rx="42" ry="6" fill={theme.primary} opacity="0.15" />
      </svg>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
          75% {
            transform: translateY(-12px) rotate(0.5deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CapybaraFloating;
