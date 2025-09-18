import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: {
    background: string;
    surface: string;
    surfaceHover: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryHover: string;
    success: string;
    error: string;
    warning: string;
    shadow: string;
    glassBg: string;
    glassHover: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightTheme = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceHover: 'rgba(255, 255, 255, 1)',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: 'rgba(255, 255, 255, 0.2)',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  shadow: 'rgba(0, 0, 0, 0.1)',
  glassBg: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.2)',
};

const darkTheme = {
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  surface: 'rgba(30, 41, 59, 0.95)',
  surfaceHover: 'rgba(51, 65, 85, 0.95)',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.2)',
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  shadow: 'rgba(0, 0, 0, 0.3)',
  glassBg: 'rgba(30, 41, 59, 0.3)',
  glassHover: 'rgba(51, 65, 85, 0.4)',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
