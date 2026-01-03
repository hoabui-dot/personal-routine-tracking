import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { gameApi } from '@/lib/api/game';
import { GameSummary } from '@/types/game';

export default function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [summary, setSummary] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await gameApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('[Dashboard Error] Failed to load summary:', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
          } : error,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  // Get current user's summary
  const userSummary = summary.find(s => s.user_id === user?.id);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Dashboard - Capybara Tracker</title>
          <meta name="description" content="Your personal dashboard" />
        </Head>

        <div style={{
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Image */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/images/ve-capybara-1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15,
            zIndex: 0
          }} />

          {/* Overlay gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.background}95 0%, ${theme.background}98 100%)`,
            zIndex: 1
          }} />

          {/* Content */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)'
          }}>
            {/* Welcome Section */}
            <div style={{
              marginBottom: 'clamp(2rem, 5vw, 3rem)',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: '800',
                color: theme.text,
                marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
                lineHeight: 1.2
              }}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}! 👋
              </h1>
              <p style={{
                fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                color: theme.textSecondary,
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Welcome to your personal dashboard. Track your progress and achieve your goals!
              </p>
            </div>

            {/* Stats Cards */}
            {!loading && userSummary && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                gap: 'clamp(1rem, 3vw, 2rem)',
                marginBottom: 'clamp(2rem, 5vw, 3rem)'
              }}>
                {/* Completed Sessions */}
                <div style={{
                  background: theme.surface,
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1.5rem',
                  padding: 'clamp(1.5rem, 4vw, 2rem)',
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 8px 24px ${theme.shadow}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${theme.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${theme.shadow}`;
                }}
                >
                  <div style={{
                    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                    marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                  }}>
                    ✅
                  </div>
                  <div style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: '800',
                    color: theme.success,
                    marginBottom: '0.5rem'
                  }}>
                    {userSummary.total_done}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: theme.textSecondary,
                    fontWeight: '600'
                  }}>
                    Completed Sessions
                  </div>
                </div>

                {/* Missed Sessions */}
                <div style={{
                  background: theme.surface,
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1.5rem',
                  padding: 'clamp(1.5rem, 4vw, 2rem)',
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 8px 24px ${theme.shadow}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${theme.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${theme.shadow}`;
                }}
                >
                  <div style={{
                    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                    marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                  }}>
                    ❌
                  </div>
                  <div style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: '800',
                    color: theme.error,
                    marginBottom: '0.5rem'
                  }}>
                    {userSummary.total_missed}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: theme.textSecondary,
                    fontWeight: '600'
                  }}>
                    Missed Sessions
                  </div>
                </div>

                {/* Success Rate */}
                <div style={{
                  background: theme.surface,
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1.5rem',
                  padding: 'clamp(1.5rem, 4vw, 2rem)',
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 8px 24px ${theme.shadow}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${theme.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${theme.shadow}`;
                }}
                >
                  <div style={{
                    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                    marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                  }}>
                    📊
                  </div>
                  <div style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: '800',
                    color: theme.primary,
                    marginBottom: '0.5rem'
                  }}>
                    {userSummary.total_done + userSummary.total_missed > 0
                      ? Math.round((userSummary.total_done / (userSummary.total_done + userSummary.total_missed)) * 100)
                      : 0}%
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: theme.textSecondary,
                    fontWeight: '600'
                  }}>
                    Success Rate
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              background: theme.surface,
              backdropFilter: 'blur(10px)',
              borderRadius: '1.5rem',
              padding: 'clamp(1.5rem, 4vw, 2rem)',
              border: `1px solid ${theme.border}`,
              boxShadow: `0 8px 24px ${theme.shadow}`,
              marginBottom: 'clamp(2rem, 5vw, 3rem)'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                fontWeight: '700',
                color: theme.text,
                marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
              }}>
                Quick Actions
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: 'clamp(0.75rem, 2vw, 1rem)'
              }}>
                <Link href="/calendar">
                  <button style={{
                    width: '100%',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    border: 'none',
                    borderRadius: '1rem',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${theme.shadow}`,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 20px ${theme.shadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadow}`;
                  }}
                  >
                    📅 View Calendar
                  </button>
                </Link>

                <Link href="/goals">
                  <button style={{
                    width: '100%',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    background: theme.surface,
                    border: `2px solid ${theme.primary}`,
                    borderRadius: '1rem',
                    color: theme.primary,
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${theme.shadow}`,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = theme.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = theme.surface;
                    e.currentTarget.style.color = theme.primary;
                  }}
                  >
                    🎯 Manage Goals
                  </button>
                </Link>

                <Link href="/reports">
                  <button style={{
                    width: '100%',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    background: theme.surface,
                    border: `2px solid ${theme.primary}`,
                    borderRadius: '1rem',
                    color: theme.primary,
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${theme.shadow}`,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = theme.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = theme.surface;
                    e.currentTarget.style.color = theme.primary;
                  }}
                  >
                    📊 View Reports
                  </button>
                </Link>

                <Link href="/settings">
                  <button style={{
                    width: '100%',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    background: theme.surface,
                    border: `2px solid ${theme.primary}`,
                    borderRadius: '1rem',
                    color: theme.primary,
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${theme.shadow}`,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = theme.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = theme.surface;
                    e.currentTarget.style.color = theme.primary;
                  }}
                  >
                    ⚙️ Settings
                  </button>
                </Link>
              </div>
            </div>

            {/* Motivational Quote */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`,
              borderRadius: '1.5rem',
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              border: `1px solid ${theme.border}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
              }}>
                🦫
              </div>
              <p style={{
                fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                fontWeight: '600',
                color: theme.text,
                fontStyle: 'italic',
                marginBottom: '0.5rem',
                lineHeight: 1.6
              }}>
                "Stay calm and focused, just like a capybara by the water."
              </p>
              <p style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: theme.textSecondary
              }}>
                Keep up the great work! 💪
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
