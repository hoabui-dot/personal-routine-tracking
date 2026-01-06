import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import CapybaraIcon from './CapybaraIcon';

const Header: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const getUserInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav style={{
      background: theme.surface,
      backdropFilter: 'blur(10px)',
      borderBottom: `2px solid ${theme.border}`,
      boxShadow: `0 2px 8px ${theme.shadow}`,
      transition: 'all 0.3s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo */}
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: theme.primary,
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 6px ${theme.shadow}`,
              }}>
                <CapybaraIcon size={28} />
              </div>
              Capybara Tracker
            </Link>

            {/* Navigation Links */}
            <div style={{
              display: 'flex',
              marginLeft: '2rem',
              gap: '0.5rem',
            }}>
              <Link href="/dashboard" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/dashboard') ? theme.primary : theme.textSecondary,
                background: isActive('/dashboard') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/dashboard') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              <Link href="/goals" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/goals') ? theme.primary : theme.textSecondary,
                background: isActive('/goals') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/goals') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Goals
              </Link>

              <Link href="/calendar" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/calendar') ? theme.primary : theme.textSecondary,
                background: isActive('/calendar') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/calendar') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </Link>

              <Link href="/notes" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/notes') ? theme.primary : theme.textSecondary,
                background: isActive('/notes') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/notes') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </Link>

              <Link href="/reports" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/reports') ? theme.primary : theme.textSecondary,
                background: isActive('/reports') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/reports') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </Link>

              <Link href="/settings" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/settings') ? theme.primary : theme.textSecondary,
                background: isActive('/settings') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/settings') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>

              <Link href="/profile" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive('/profile') ? theme.primary : theme.textSecondary,
                background: isActive('/profile') ? theme.highlight : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive('/profile') ? `2px solid ${theme.primary}` : '2px solid transparent',
              }}>
                {user && (
                  <div style={{
                    width: '1.125rem',
                    height: '1.125rem',
                    borderRadius: '50%',
                    background: !user.avatar_url ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    fontWeight: '600',
                    overflow: 'hidden',
                    border: `1px solid ${isActive('/profile') ? theme.primary : theme.border}`,
                  }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getUserInitials(user.name)
                    )}
                  </div>
                )}
                Profile
              </Link>
            </div>
          </div>

          {/* Right side - Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
