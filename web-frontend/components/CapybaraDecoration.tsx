import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CapybaraDecoration: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      opacity: 0.15,
      pointerEvents: 'none',
      zIndex: 0,
      transition: 'opacity 0.3s ease'
    }}>
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large decorative capybara */}
        {/* Body */}
        <ellipse cx="100" cy="120" rx="70" ry="55" fill={theme.accent} opacity="0.6" />
        
        {/* Head */}
        <ellipse cx="100" cy="70" rx="50" ry="45" fill={theme.primary} opacity="0.6" />
        
        {/* Ears */}
        <ellipse cx="70" cy="40" rx="12" ry="18" fill={theme.accent} opacity="0.6" />
        <ellipse cx="130" cy="40" rx="12" ry="18" fill={theme.accent} opacity="0.6" />
        
        {/* Eyes */}
        <circle cx="80" cy="65" r="8" fill={theme.text} opacity="0.4" />
        <circle cx="120" cy="65" r="8" fill={theme.text} opacity="0.4" />
        <circle cx="82" cy="63" r="3" fill="white" opacity="0.6" />
        <circle cx="122" cy="63" r="3" fill="white" opacity="0.6" />
        
        {/* Nose */}
        <ellipse cx="100" cy="82" rx="10" ry="6" fill={theme.text} opacity="0.4" />
        
        {/* Happy smile */}
        <path
          d="M 85 90 Q 100 95 115 90"
          stroke={theme.text}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        
        {/* Legs */}
        <ellipse cx="70" cy="165" rx="12" ry="20" fill={theme.accent} opacity="0.6" />
        <ellipse cx="100" cy="170" rx="12" ry="20" fill={theme.accent} opacity="0.6" />
        <ellipse cx="130" cy="165" rx="12" ry="20" fill={theme.accent} opacity="0.6" />
        
        {/* Grass decoration */}
        <path
          d="M 20 180 Q 25 170 30 180 M 40 180 Q 45 165 50 180 M 60 180 Q 65 172 70 180"
          stroke={theme.success}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 130 180 Q 135 172 140 180 M 150 180 Q 155 165 160 180 M 170 180 Q 175 170 180 180"
          stroke={theme.success}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default CapybaraDecoration;
