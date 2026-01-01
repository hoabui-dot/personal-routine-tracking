import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useTheme } from '../contexts/ThemeContext';
import { gameApi } from '../lib/api/game';
import { UserGoal } from '../types/game';
import { useToast } from '../contexts/ToastContext';
import CapybaraBanner from '../components/CapybaraBanner';
import CapybaraFloating from '../components/CapybaraFloating';
import CapybaraLoader from '../components/CapybaraLoader';

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const toast = useToast();

  const loadUserGoals = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await gameApi.getUserGoals();
      setUserGoals(data);
    } catch (error) {
      console.error('Failed to load user goals:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUserGoals();
  }, [loadUserGoals]);

  const handleUpdateDuration = async (userId: number, goalId: number, hours: number) => {
    setSaving(userId);
    try {
      const minutes = hours * 60;
      await gameApi.updateUserGoal(userId, goalId, minutes);
      await loadUserGoals();
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <CapybaraLoader text="Loading settings..." />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ position: 'relative' }}>
          {/* Floating Capybara Decorations */}
          <CapybaraFloating position="top-right" size={100} />
          <CapybaraFloating position="bottom-left" size={110} />

          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Capybara Banner */}
            <CapybaraBanner 
              title="Game Settings" 
              subtitle="Configure daily duration goals for each player"
            />

            <div style={{
              background: theme.surface,
              borderRadius: '1.5rem',
              boxShadow: `0 10px 25px ${theme.shadow}`,
              padding: '2.5rem',
              border: `1px solid ${theme.border}`
            }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: theme.text,
            marginBottom: '0.5rem'
          }}>
            Player Goals
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: theme.textSecondary,
            marginBottom: '2rem'
          }}>
            Manage daily duration targets
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {userGoals.map(userGoal => (
              <div key={userGoal.id} style={{
                padding: '1.5rem',
                background: theme.background,
                borderRadius: '1rem',
                border: `2px solid ${theme.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '0.25rem'
                    }}>
                      {userGoal.user_name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.textSecondary
                    }}>
                      Goal: {userGoal.goal_title}
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.text,
                    marginBottom: '0.5rem'
                  }}>
                    Daily Duration (hours)
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={userGoal.daily_duration_hours}
                      onChange={(e) => {
                        const newHours = parseFloat(e.target.value);
                        setUserGoals(userGoals.map(ug =>
                          ug.id === userGoal.id
                            ? { ...ug, daily_duration_hours: newHours, daily_duration_minutes: newHours * 60 }
                            : ug
                        ));
                      }}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: `2px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        background: theme.surface,
                        color: theme.text
                      }}
                    />
                    <button
                      onClick={() => handleUpdateDuration(
                        userGoal.user_id,
                        userGoal.goal_id,
                        userGoal.daily_duration_hours
                      )}
                      disabled={saving === userGoal.user_id}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: saving === userGoal.user_id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: saving === userGoal.user_id ? 0.5 : 1,
                        boxShadow: `0 4px 8px ${theme.shadow}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {saving === userGoal.user_id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: theme.textSecondary,
                    marginTop: '0.5rem'
                  }}>
                    Current: {userGoal.daily_duration_minutes} minutes ({userGoal.daily_duration_hours} hours)
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: `${theme.primary}15`,
            borderRadius: '0.75rem',
            border: `2px solid ${theme.primary}30`
          }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ color: theme.primary, fontSize: '1.25rem' }}>ℹ️</div>
              <div>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.text,
                  marginBottom: '0.25rem'
                }}>
                  How it works
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: theme.textSecondary,
                  lineHeight: '1.5'
                }}>
                  Each player must complete their daily duration to mark the day as DONE (✅). 
                  If a day ends without starting a session, it will be marked as MISSED (❌).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
    </ProtectedRoute>
  );
};

export default Settings;
