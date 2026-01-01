import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CapybaraLoaderProps {
  size?: number;
  text?: string;
}

const CapybaraLoader: React.FC<CapybaraLoaderProps> = ({ 
  size = 80,
  text = 'Loading...'
}) => {
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem'
    }}>
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        animation: 'bounce 1.5s ease-in-out infinite'
      }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Capybara body */}
          <ellipse cx="40" cy="48" rx="28" ry="22" fill={theme.accent} />
          
          {/* Capybara head */}
          <ellipse cx="40" cy="28" rx="20" ry="18" fill={theme.primary} />
          
          {/* Ears */}
          <ellipse cx="28" cy="18" rx="5" ry="8" fill={theme.accent} />
          <ellipse cx="52" cy="18" rx="5" ry="8" fill={theme.accent} />
          
          {/* Eyes - blinking animation */}
          <circle cx="33" cy="26" r="3" fill={theme.text}>
            <animate
              attributeName="r"
              values="3;0.5;3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="47" cy="26" r="3" fill={theme.text}>
            <animate
              attributeName="r"
              values="3;0.5;3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Nose */}
          <ellipse cx="40" cy="33" rx="4" ry="2.5" fill={theme.text} opacity="0.7" />
          
          {/* Smile */}
          <path
            d="M 35 36 Q 40 38 45 36"
            stroke={theme.text}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          
          {/* Legs */}
          <ellipse cx="28" cy="66" rx="5" ry="8" fill={theme.accent} />
          <ellipse cx="40" cy="68" rx="5" ry="8" fill={theme.accent} />
          <ellipse cx="52" cy="66" rx="5" ry="8" fill={theme.accent} />
        </svg>

        {/* Loading dots */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: theme.primary,
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      </div>

      {text && (
        <div style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: theme.textSecondary,
          marginTop: '1rem'
        }}>
          {text}
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default CapybaraLoader;
