import React from 'react';

interface CapybaraIconProps {
  size?: number;
  className?: string;
}

const CapybaraIcon: React.FC<CapybaraIconProps> = ({ size = 24, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Capybara body */}
      <ellipse cx="32" cy="38" rx="22" ry="18" fill="#8D6E63" />
      
      {/* Capybara head */}
      <ellipse cx="32" cy="22" rx="16" ry="14" fill="#A1887F" />
      
      {/* Ears */}
      <ellipse cx="22" cy="14" rx="4" ry="6" fill="#8D6E63" />
      <ellipse cx="42" cy="14" rx="4" ry="6" fill="#8D6E63" />
      
      {/* Eyes */}
      <circle cx="26" cy="20" r="2.5" fill="#3E2723" />
      <circle cx="38" cy="20" r="2.5" fill="#3E2723" />
      <circle cx="26.5" cy="19.5" r="1" fill="white" opacity="0.8" />
      <circle cx="38.5" cy="19.5" r="1" fill="white" opacity="0.8" />
      
      {/* Nose */}
      <ellipse cx="32" cy="26" rx="3" ry="2" fill="#6D4C41" />
      
      {/* Mouth - happy smile */}
      <path
        d="M 28 28 Q 32 30 36 28"
        stroke="#6D4C41"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Legs */}
      <ellipse cx="22" cy="52" rx="4" ry="6" fill="#8D6E63" />
      <ellipse cx="32" cy="54" rx="4" ry="6" fill="#8D6E63" />
      <ellipse cx="42" cy="52" rx="4" ry="6" fill="#8D6E63" />
      
      {/* Highlight on body */}
      <ellipse cx="28" cy="35" rx="8" ry="6" fill="white" opacity="0.15" />
    </svg>
  );
};

export default CapybaraIcon;
