import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import Snowflakes from './Snowflakes';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, currentTheme } = useTheme();

  return (
    <>
      {/* Snowflakes animation for Christmas theme */}
      {currentTheme === 'christmas' && <Snowflakes />}
      
      <div
        className="min-h-screen"
        style={{
          background: theme.background,
          color: theme.text,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Navigation Header */}
        <Header />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">{children}</div>
        </main>

        {/* Footer */}
        <footer style={{
          background: theme.surface,
          borderTop: `1px solid ${theme.border}`,
          marginTop: 'auto',
          transition: 'all 0.3s ease'
        }}>
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div style={{ 
              textAlign: 'center', 
              fontSize: '0.875rem', 
              color: theme.textSecondary 
            }}>
              Capybara Tracker - Built with Next.js & TypeScript
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
