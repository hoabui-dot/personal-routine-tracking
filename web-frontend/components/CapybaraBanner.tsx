import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CapybaraIcon from './CapybaraIcon';

interface CapybaraBannerProps {
  title: string;
  subtitle?: string;
  showIcon?: boolean;
}

const CapybaraBanner: React.FC<CapybaraBannerProps> = ({ 
  title, 
  subtitle,
  showIcon = true 
}) => {
  const { theme } = useTheme();

  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
      borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
      padding: 'clamp(1rem, 4vw, 2rem)',
      marginBottom: 'clamp(1rem, 3vw, 2rem)',
      boxShadow: `0 8px 16px ${theme.shadow}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.1) 10px,
          rgba(255,255,255,0.1) 20px
        )`
      }} />

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(1rem, 3vw, 1.5rem)',
        flexWrap: 'wrap'
      }}>
        {showIcon && (
          <div style={{
            width: 'clamp(3rem, 10vw, 4rem)',
            height: 'clamp(3rem, 10vw, 4rem)',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <CapybaraIcon size={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--icon-size') || '48')} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{
            fontSize: 'clamp(1.25rem, 5vw, 2rem)',
            fontWeight: '700',
            color: 'white',
            marginBottom: subtitle ? 'clamp(0.25rem, 1vw, 0.5rem)' : 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            lineHeight: 1.2
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '400',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              lineHeight: 1.4
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Decorative capybara silhouette - Hide on small screens */}
        <div 
          className="decorative-capybara"
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            opacity: 0.15,
            pointerEvents: 'none'
          }}
        >
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="75" cy="90" rx="50" ry="40" fill="white" />
            <ellipse cx="75" cy="50" rx="35" ry="32" fill="white" />
            <ellipse cx="55" cy="30" rx="8" ry="12" fill="white" />
            <ellipse cx="95" cy="30" rx="8" ry="12" fill="white" />
          </svg>
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 640px) {
          .decorative-capybara {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CapybaraBanner;
