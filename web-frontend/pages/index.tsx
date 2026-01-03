import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import CapybaraIcon from '@/components/CapybaraIcon';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Capybara Tracker - Your Daily Goal Companion</title>
        <meta name="description" content="Track your daily goals with Capybara Tracker - A fun and engaging two-player goal tracking app" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.accent}15 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, ${theme.primary}10 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${theme.accent}10 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, ${theme.primary}08 0%, transparent 50%)
          `,
          opacity: 0.6
        }} />

        {/* Floating Capybara Decorations */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite'
        }}>
          <svg width="150" height="150" viewBox="0 0 120 120" fill="none">
            <ellipse cx="60" cy="75" rx="40" ry="30" fill={theme.primary} />
            <ellipse cx="60" cy="45" rx="28" ry="25" fill={theme.accent} />
            <ellipse cx="45" cy="28" rx="7" ry="10" fill={theme.primary} />
            <ellipse cx="75" cy="28" rx="7" ry="10" fill={theme.primary} />
          </svg>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite'
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <ellipse cx="60" cy="75" rx="40" ry="30" fill={theme.accent} />
            <ellipse cx="60" cy="45" rx="28" ry="25" fill={theme.primary} />
          </svg>
        </div>

        {/* Header */}
        <header style={{
          position: 'relative',
          zIndex: 10,
          padding: 'clamp(1rem, 3vw, 2rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)'
          }}>
            <div style={{
              width: 'clamp(2.5rem, 8vw, 3rem)',
              height: 'clamp(2.5rem, 8vw, 3rem)',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${theme.shadow}`
            }}>
              <CapybaraIcon size={parseInt('clamp(28, 6vw, 36)')} />
            </div>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight: '700',
              color: theme.text,
              margin: 0
            }}>
              Capybara Tracker
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1rem)', alignItems: 'center' }}>
            <ThemeToggle />
            <Link href="/login">
              <button style={{
                padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                background: 'transparent',
                border: `2px solid ${theme.primary}`,
                borderRadius: '0.75rem',
                color: theme.primary,
                fontWeight: '600',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.primary;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.primary;
              }}
              >
                Sign In
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(2rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)',
          textAlign: 'center'
        }}>
          {/* Main Hero */}
          <div style={{
            marginBottom: 'clamp(3rem, 8vw, 5rem)'
          }}>
            <div style={{
              display: 'inline-block',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
            }}>
              <div style={{
                width: 'clamp(120px, 25vw, 180px)',
                height: 'clamp(120px, 25vw, 180px)',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 20px 40px ${theme.shadow}`,
                animation: 'bounce 3s ease-in-out infinite'
              }}>
                <CapybaraIcon size={parseInt('clamp(80, 18vw, 120)')} />
              </div>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              fontWeight: '800',
              color: theme.text,
              marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
              lineHeight: 1.2
            }}>
              Track Your Goals<br />
              <span style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                With Capybara
              </span>
            </h2>

            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              color: theme.textSecondary,
              marginBottom: 'clamp(2rem, 5vw, 3rem)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              A fun and engaging two-player daily goal tracking app. 
              Stay motivated, track progress, and achieve your dreams together! 🎯
            </p>

            <div style={{
              display: 'flex',
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link href="/login">
                <button style={{
                  padding: 'clamp(0.875rem, 2vw, 1.125rem) clamp(2rem, 5vw, 3rem)',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  border: 'none',
                  borderRadius: '1rem',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${theme.shadow}`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 28px ${theme.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${theme.shadow}`;
                }}
                >
                  Get Started →
                </button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(1rem, 3vw, 2rem)',
            marginTop: 'clamp(3rem, 8vw, 5rem)'
          }}>
            {[
              {
                icon: '📊',
                title: 'Track Progress',
                description: 'Monitor your daily sessions and see your achievements grow'
              },
              {
                icon: '🎮',
                title: 'Two-Player Mode',
                description: 'Compete with your partner and stay motivated together'
              },
              {
                icon: '📅',
                title: 'Calendar View',
                description: 'Visualize your progress with an intuitive calendar interface'
              },
              {
                icon: '💬',
                title: 'Real-time Chat',
                description: 'Stay connected with instant messaging and typing indicators'
              },
              {
                icon: '⏱️',
                title: 'Session Timer',
                description: 'Start, pause, and track your focused work sessions'
              },
              {
                icon: '🎯',
                title: 'Goal Management',
                description: 'Set, organize, and achieve your personal goals'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: theme.surface,
                padding: 'clamp(1.5rem, 4vw, 2rem)',
                borderRadius: '1.5rem',
                border: `1px solid ${theme.border}`,
                boxShadow: `0 4px 12px ${theme.shadow}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${theme.shadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadow}`;
              }}
              >
                <div style={{
                  fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                  marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  fontWeight: '700',
                  color: theme.text,
                  marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  color: theme.textSecondary,
                  lineHeight: 1.6
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: 'clamp(2rem, 5vw, 3rem)',
          color: theme.textSecondary,
          fontSize: 'clamp(0.875rem, 2vw, 1rem)'
        }}>
          <p>© 2025 Capybara Tracker. Built with ❤️ and 🦫</p>
        </footer>

        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}</style>
      </div>
    </>
  );
}
