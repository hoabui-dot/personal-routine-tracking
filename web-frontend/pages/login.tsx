import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CapybaraIcon from '../components/CapybaraIcon';
import CapybaraFloating from '../components/CapybaraFloating';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: theme.background,
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Capybara Decorations */}
      <CapybaraFloating position="top-left" size={100} />
      <CapybaraFloating position="bottom-right" size={140} />

        <div style={{
          background: theme.surface,
          borderRadius: '1rem',
          boxShadow: `0 10px 25px ${theme.shadow}`,
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          border: `1px solid ${theme.border}`,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Capybara Logo */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              borderRadius: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px ${theme.shadow}`
            }}>
              <CapybaraIcon size={56} />
            </div>
          </div>

          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: theme.text, 
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            fontSize: '0.875rem', 
            color: theme.textSecondary, 
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Sign in to Capybara Tracker
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: theme.text,
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${theme.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: theme.background,
                  color: theme.text,
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: theme.text,
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${theme.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: theme.background,
                  color: theme.text,
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading ? theme.border : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                boxShadow: loading ? 'none' : `0 4px 8px ${theme.shadow}`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 12px ${theme.shadow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 8px ${theme.shadow}`;
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
              <Link 
                href="/forgot-password" 
                style={{ color: theme.primary, textDecoration: 'none', fontWeight: '500' }}
              >
                Forgot password?
              </Link>
              <span style={{ color: theme.textSecondary, margin: '0 0.5rem' }}>•</span>
              <Link 
                href="/register" 
                style={{ color: theme.primary, textDecoration: 'none', fontWeight: '500' }}
              >
                Create account
              </Link>
            </div>
          </form>
        </div>
    </div>
  );
};

export default LoginPage;
