import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'capybara-light' | 'capybara-dark' | 'christmas';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  loading: boolean;
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

const capybaraLightTheme = {
  // Capybara-inspired warm, earthy tones
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
  accent: '#a1887f', // Soft taupe
  accentHover: '#8d6e63',
  cardBg: 'rgba(255, 248, 240, 0.9)', // Warm white
  highlight: '#ffcc80', // Soft orange highlight
};

const capybaraDarkTheme = {
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
  accent: '#bcaaa4', // Light taupe
  accentHover: '#a1887f',
  cardBg: 'rgba(78, 52, 46, 0.8)', // Dark warm card
  highlight: '#ffab91', // Warm highlight
};

const christmasTheme = {
  // Merry Christmas 2025 - Modern Festive Theme
  background: 'linear-gradient(135deg, #2E523C 0%, #243B55 50%, #2E523C 100%)', // Forest green to midnight blue
  surface: 'rgba(246, 242, 233, 0.98)', // Warm cream/ivory
  surfaceHover: 'rgba(246, 242, 233, 1)',
  text: '#333333', // Charcoal for light backgrounds
  textSecondary: '#5a5a5a', // Medium gray
  border: 'rgba(212, 165, 93, 0.3)', // Metallic gold border
  primary: '#A12F2D', // Burgundy/Rich red for CTAs
  primaryHover: '#8a2624',
  success: '#2E523C', // Forest green
  error: '#A12F2D',
  warning: '#D4A55D', // Metallic gold
  shadow: 'rgba(0, 0, 0, 0.15)',
  glassBg: 'rgba(246, 242, 233, 0.25)',
  glassHover: 'rgba(246, 242, 233, 0.35)',
  accent: '#D4A55D', // Metallic gold
  accentHover: '#c49547',
  cardBg: 'rgba(246, 242, 233, 0.95)', // Warm cream card
  highlight: '#C7D8E0', // Soft silver/ice blue
};

const themes = {
  'capybara-light': capybaraLightTheme,
  'capybara-dark': capybaraDarkTheme,
  'christmas': christmasTheme,
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('capybara-light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to load theme from localStorage first (fast)
        const savedTheme = localStorage.getItem('app-theme') as ThemeName;
        if (savedTheme && themes[savedTheme]) {
          setCurrentTheme(savedTheme);
        } else {
          // Check old theme format for backward compatibility
          const oldTheme = localStorage.getItem('theme');
          if (oldTheme === 'dark') {
            setCurrentTheme('capybara-dark');
          } else {
            setCurrentTheme('capybara-light');
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('app-theme', theme);
  };

  const toggleTheme = () => {
    // Toggle between light and dark capybara themes
    const newTheme = currentTheme === 'capybara-dark' ? 'capybara-light' : 'capybara-dark';
    setTheme(newTheme);
  };

  const isDarkMode = currentTheme === 'capybara-dark';
  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, currentTheme, setTheme, loading, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
