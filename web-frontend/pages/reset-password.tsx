import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CapybaraIcon from '../components/CapybaraIcon';
import CapybaraFloating from '../components/CapybaraFloating';
import api from '../lib/api';

const ResetPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!token && router.isReady) {
      setError('Invalid or missing reset token');
    }
  }, [token, router.isReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        password 
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('[Reset Password Error] Failed to reset password:', {
        endpoint: '/auth/reset-password',
        method: 'POST',
        hasToken: !!token,
        error: {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        },
      });
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: theme.background
      }}>
        <div style={{ color: theme.text }}>Loading...</div>
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  if (success) {
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
        <CapybaraFloating position="top-left" size={100} />
        <CapybaraFloating position="bottom-right" size={140} />

        <div style={{
          background: theme.surface,
          borderRadius: '1rem',
          boxShadow: `0 10px 25px ${theme.shadow}`,
          padding: '2rem',
          width: '100%',
          maxWidth: '500px',
          border: `1px solid ${theme.border}`,
          position: 'relative',
          zIndex: 1,
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            borderRadius: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: `0 8px 16px ${theme.shadow}`
          }}>
            <CapybaraIcon size={56} />
          </div>

          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            ✅
          </div>

          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: theme.text, 
            marginBottom: '1rem'
          }}>
            Password Reset Successful!
          </h1>

          <p style={{ 
            fontSize: '1rem', 
            color: theme.textSecondary, 
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Your password has been successfully reset. You can now log in with your new password.
          </p>

          <div style={{
            background: `${theme.primary}15`,
            border: `1px solid ${theme.primary}40`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: theme.textSecondary
          }}>
            Redirecting to login page in 3 seconds...
          </div>

          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 4px 8px ${theme.shadow}`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 12px ${theme.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 8px ${theme.shadow}`;
            }}
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

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
      <CapybaraFloating position="top-left" size={100} />
      <CapybaraFloating position="bottom-right" size={140} />

      <div style={{
        background: theme.surface,
        borderRadius: '1rem',
        boxShadow: `0 10px 25px ${theme.shadow}`,
        padding: '2rem',
        width: '100%',
        maxWidth: '450px',
        border: `1px solid ${theme.border}`,
        position: 'relative',
        zIndex: 1
      }}>
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
          Reset Password
        </h1>
        <p style={{ 
          fontSize: '0.875rem', 
          color: theme.textSecondary, 
          marginBottom: '2rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Enter your new password below 🔑
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
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
            <p style={{
              fontSize: '0.75rem',
              color: theme.textSecondary,
              marginTop: '0.25rem'
            }}>
              Must be at least 6 characters
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: theme.text,
              marginBottom: '0.5rem'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={loading || !token}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: (loading || !token) ? theme.border : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (loading || !token) ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
              boxShadow: (loading || !token) ? 'none' : `0 4px 8px ${theme.shadow}`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading && token) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 12px ${theme.shadow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && token) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 8px ${theme.shadow}`;
              }
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            <Link 
              href="/login" 
              style={{ color: theme.primary, textDecoration: 'none', fontWeight: '500' }}
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
