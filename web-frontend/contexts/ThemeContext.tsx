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
    accent: string;
    accentHover: string;
    cardBg: string;
    highlight: string;
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
  // Capybara-inspired warm, earthy tones for 2025
  background: 'linear-gradient(135deg, #f4e4d7 0%, #e8d5c4 50%, #d4b5a0 100%)', // Warm capybara fur colors
  surface: 'rgba(255, 250, 245, 0.95)', // Soft cream
  surfaceHover: 'rgba(255, 250, 245, 1)',
  text: '#3e2723', // Dark brown
  textSecondary: '#6d4c41', // Medium brown
  border: 'rgba(141, 110, 99, 0.2)', // Light brown border
  primary: '#d4845c', // Warm orange (capybara nose)
  primaryHover: '#c97550',
  success: '#7cb342', // Natural green (grass)
  error: '#e57373',
  warning: '#ffb74d',
  shadow: 'rgba(62, 39, 35, 0.1)',
  glassBg: 'rgba(255, 250, 245, 0.15)',
  glassHover: 'rgba(255, 250, 245, 0.25)',
  // Additional capybara colors
  accent: '#a1887f', // Soft taupe
  accentHover: '#8d6e63',
  cardBg: 'rgba(255, 248, 240, 0.9)', // Warm white
  highlight: '#ffcc80', // Soft orange highlight
};

const darkTheme = {
  // Dark mode with warm, cozy capybara evening tones
  background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 50%, #5d4037 100%)', // Deep brown gradient
  surface: 'rgba(62, 39, 35, 0.95)', // Dark chocolate
  surfaceHover: 'rgba(78, 52, 46, 0.95)',
  text: '#ffefd5', // Warm cream text
  textSecondary: '#d7ccc8', // Light brown
  border: 'rgba(215, 204, 200, 0.2)',
  primary: '#ff9e6d', // Bright warm orange
  primaryHover: '#ff8a50',
  success: '#9ccc65', // Soft green
  error: '#ef5350',
  warning: '#ffb74d',
  shadow: 'rgba(0, 0, 0, 0.4)',
  glassBg: 'rgba(62, 39, 35, 0.3)',
  glassHover: 'rgba(78, 52, 46, 0.4)',
  // Additional capybara colors
  accent: '#bcaaa4', // Light taupe
  accentHover: '#a1887f',
  cardBg: 'rgba(78, 52, 46, 0.8)', // Dark warm card
  highlight: '#ffab91', // Warm highlight
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
