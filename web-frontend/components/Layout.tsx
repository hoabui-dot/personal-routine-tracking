import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import CapybaraIcon from './CapybaraIcon';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const isActive = (path: string) => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme.background,
        color: theme.text,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Navigation Header */}
      <nav style={{
        background: theme.surface,
        backdropFilter: 'blur(10px)',
        borderBottom: `2px solid ${theme.border}`,
        boxShadow: `0 2px 8px ${theme.shadow}`,
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
        transition: 'all 0.3s ease'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo with Capybara */}
              <Link href="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: theme.primary,
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 6px ${theme.shadow}`
                }}>
                  <CapybaraIcon size={28} />
                </div>
                Capybara Tracker
              </Link>

              {/* Navigation Links - Desktop */}
              <div style={{ 
                display: 'none',
                marginLeft: '2rem',
                gap: '0.5rem'
              }}
              className="sm:flex"
              >
                <Link
                  href="/dashboard"
                  style={{
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
                    border: isActive('/dashboard') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  <svg
                    style={{ width: '1.125rem', height: '1.125rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </Link>

                <Link
                  href="/goals"
                  style={{
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
                    border: isActive('/goals') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  <svg
                    style={{ width: '1.125rem', height: '1.125rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Goals
                </Link>

                <Link
                  href="/calendar"
                  style={{
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
                    border: isActive('/calendar') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  <svg
                    style={{ width: '1.125rem', height: '1.125rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Calendar
                </Link>

                <Link
                  href="/reports"
                  style={{
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
                    border: isActive('/reports') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  <svg
                    style={{ width: '1.125rem', height: '1.125rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Reports
                </Link>

                <Link
                  href="/settings"
                  style={{
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
                    border: isActive('/settings') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  <svg
                    style={{ width: '1.125rem', height: '1.125rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </Link>

                <Link
                  href="/profile"
                  style={{
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
                    border: isActive('/profile') ? `2px solid ${theme.primary}` : '2px solid transparent'
                  }}
                >
                  {/* User Avatar */}
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
                      border: `1px solid ${isActive('/profile') ? theme.primary : theme.border}`
                    }}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        getUserInitials(user.name)
                      )}
                    </div>
                  )}
                  Profile
                </Link>
              </div>
            </div>

            {/* Desktop Theme Toggle & Avatar */}
            <div style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }} className="sm:flex">
              <ThemeToggle />
              
              {/* Avatar Dropdown */}
              {user && (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: !user.avatar_url ? 'linear-gradient(135deg, #d4845c 0%, #c97550 100%)' : 'transparent',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isDropdownOpen ? '0 0 0 3px rgba(212, 132, 92, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                      transform: isDropdownOpen ? 'scale(1.05)' : 'scale(1)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Failed to load avatar in header:', user.avatar_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      getUserInitials(user.name)
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50px',
                        right: '0',
                        width: '280px',
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        animation: 'slideDown 0.2s ease-out',
                      }}
                    >
                      {/* User Info */}
                      <div style={{
                        padding: '1.25rem',
                        borderBottom: `1px solid ${theme.border}`,
                        background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.background} 100%)`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: !user.avatar_url ? 'linear-gradient(135deg, #d4845c 0%, #c97550 100%)' : 'transparent',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            flexShrink: 0,
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  console.error('Failed to load avatar in dropdown:', user.avatar_url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              getUserInitials(user.name)
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: theme.text,
                              marginBottom: '0.25rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {user.name}
                            </div>
                            <div style={{
                              fontSize: '0.8125rem',
                              color: theme.textSecondary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <div style={{ padding: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            color: theme.error,
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <svg
                            style={{ width: '18px', height: '18px' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Right Side - Theme Toggle, Profile Avatar, Menu Button */}
            <div className="sm:hidden flex items-center" style={{ gap: '0.5rem' }}>
              {/* Theme Toggle - Redesigned */}
              <ThemeToggle />
              {/* Hamburger Menu Button - Capybara Icon */}
              <button
                type="button"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu');
                  const button = document.querySelector('.mobile-menu-button');
                  if (mobileMenu && button) {
                    mobileMenu.classList.toggle('hidden');
                    button.classList.toggle('menu-open');
                  }
                }}
                className="mobile-menu-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  padding: '0.25rem',
                  borderRadius: '0.5rem',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  border: `2px solid ${theme.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 2px 6px ${theme.shadow}`,
                }}
              >
                <CapybaraIcon size={24} />
              </button>
                            {/* Profile Avatar Button - Mobile */}
              {user && (
                <Link
                  href="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: !user.avatar_url ? 'linear-gradient(135deg, #d4845c 0%, #c97550 100%)' : 'transparent',
                    color: 'white',
                    border: `2px solid ${theme.border}`,
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 2px 6px ${theme.shadow}`,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        console.error('Failed to load avatar in mobile header:', user.avatar_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    getUserInitials(user.name)
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu - Redesigned */}
        <div
          className="sm:hidden hidden"
          id="mobile-menu"
          style={{
            background: theme.surface,
            backdropFilter: 'blur(20px)',
            borderTop: `2px solid ${theme.border}`,
            boxShadow: `0 4px 12px ${theme.shadow}`,
            animation: 'slideDown 0.2s ease-out',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                const button = document.querySelector('.mobile-menu-button');
                if (mobileMenu && button) {
                  mobileMenu.classList.add('hidden');
                  button.classList.remove('menu-open');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive('/dashboard') ? theme.highlight : 'transparent',
                border: isActive('/dashboard') ? `2px solid ${theme.primary}` : `2px solid transparent`,
                color: theme.text,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive('/dashboard') ? `0 2px 8px ${theme.shadow}` : 'none'
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 4px ${theme.shadow}`
              }}>
                <svg
                  style={{ width: '1rem', height: '1rem', color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: '600', lineHeight: 1.2 }}>Dashboard</span>
                <span style={{ fontSize: '0.8125rem', color: theme.textSecondary, fontWeight: '400', lineHeight: 1.2 }}>
                  Your overview
                </span>
              </div>
            </Link>

            {/* Goals Link */}
            <Link
              href="/goals"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                const button = document.querySelector('.mobile-menu-button');
                if (mobileMenu && button) {
                  mobileMenu.classList.add('hidden');
                  button.classList.remove('menu-open');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive('/goals') ? theme.highlight : 'transparent',
                border: isActive('/goals') ? `2px solid ${theme.primary}` : `2px solid transparent`,
                color: theme.text,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive('/goals') ? `0 2px 8px ${theme.shadow}` : 'none'
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 4px ${theme.shadow}`
              }}>
                <svg
                  style={{ width: '1rem', height: '1rem', color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: '600', lineHeight: 1.2 }}>Goals</span>
                <span style={{ fontSize: '0.8125rem', color: theme.textSecondary, fontWeight: '400', lineHeight: 1.2 }}>
                  Manage your objectives
                </span>
              </div>
            </Link>

            {/* Calendar Link */}
            <Link
              href="/calendar"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                const button = document.querySelector('.mobile-menu-button');
                if (mobileMenu && button) {
                  mobileMenu.classList.add('hidden');
                  button.classList.remove('menu-open');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive('/calendar') ? theme.highlight : 'transparent',
                border: isActive('/calendar') ? `2px solid ${theme.primary}` : `2px solid transparent`,
                color: theme.text,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive('/calendar') ? `0 2px 8px ${theme.shadow}` : 'none'
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 4px ${theme.shadow}`
              }}>
                <svg
                  style={{ width: '1rem', height: '1rem', color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: '600', lineHeight: 1.2 }}>Calendar</span>
                <span style={{ fontSize: '0.8125rem', color: theme.textSecondary, fontWeight: '400', lineHeight: 1.2 }}>
                  Daily sessions
                </span>
              </div>
            </Link>

            {/* Reports Link */}
            <Link
              href="/reports"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                const button = document.querySelector('.mobile-menu-button');
                if (mobileMenu && button) {
                  mobileMenu.classList.add('hidden');
                  button.classList.remove('menu-open');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive('/reports') ? theme.highlight : 'transparent',
                border: isActive('/reports') ? `2px solid ${theme.primary}` : `2px solid transparent`,
                color: theme.text,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive('/reports') ? `0 2px 8px ${theme.shadow}` : 'none'
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 4px ${theme.shadow}`
              }}>
                <svg
                  style={{ width: '1rem', height: '1rem', color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: '600', lineHeight: 1.2 }}>Reports</span>
                <span style={{ fontSize: '0.8125rem', color: theme.textSecondary, fontWeight: '400', lineHeight: 1.2 }}>
                  View your progress
                </span>
              </div>
            </Link>

            {/* Settings Link */}
            <Link
              href="/settings"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                const button = document.querySelector('.mobile-menu-button');
                if (mobileMenu && button) {
                  mobileMenu.classList.add('hidden');
                  button.classList.remove('menu-open');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isActive('/settings') ? theme.highlight : 'transparent',
                border: isActive('/settings') ? `2px solid ${theme.primary}` : `2px solid transparent`,
                color: theme.text,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive('/settings') ? `0 2px 8px ${theme.shadow}` : 'none'
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 4px ${theme.shadow}`
              }}>
                <svg
                  style={{ width: '1rem', height: '1rem', color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: '600', lineHeight: 1.2 }}>Settings</span>
                <span style={{ fontSize: '0.8125rem', color: theme.textSecondary, fontWeight: '400', lineHeight: 1.2 }}>
                  Configure settings
                </span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

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
  );
};

export default Layout;
