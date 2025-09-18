import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import SubGoalCard from '@/components/SubGoalCard';
import { Goal } from '@/types/Goal';
import { SubGoal, CreateSubGoalRequest } from '@/types/SubGoal';
import { Session, SessionStats } from '@/types/Session';
import { goalsApi, subGoalsApi, sessionsApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function GoalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const { theme } = useTheme();

  // Parse goalId safely
  const goalId = React.useMemo(() => {
    if (!id || Array.isArray(id)) return null;
    const parsed = parseInt(id);
    return isNaN(parsed) ? null : parsed;
  }, [id]);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Sub-goal form state
  const [showSubGoalForm, setShowSubGoalForm] = useState(false);
  const [subGoalForm, setSubGoalForm] = useState<CreateSubGoalRequest>({
    goal_id: goalId || 0,
    title: '',
    description: '',
    hours_expected: 0,
    start_date: '01/01',
    end_date: '31/12',
  });
  const [subGoalLoading, setSubGoalLoading] = useState(false);

  // Session states
  const [activeSessions, setActiveSessions] = useState<{
    [key: number]: Session | null;
  }>({});
  const [sessionStats, setSessionStats] = useState<{
    [key: number]: SessionStats;
  }>({});

  const loadGoalData = useCallback(async () => {
    if (!goalId) return;

    try {
      setLoading(true);
      setError('');

      // Load goal details
      const goalData = await goalsApi.getById(goalId);
      setGoal(goalData);

      // Load sub-goals
      const subGoalsData = await subGoalsApi.getByGoalId(goalId);
      setSubGoals(subGoalsData);

      // Load session data for each sub-goal
      const activeSessionsData: { [key: number]: Session | null } = {};
      const sessionStatsData: { [key: number]: SessionStats } = {};

      for (const subGoal of subGoalsData) {
        try {
          // Get active session
          const activeSession = await sessionsApi.getActiveBySubGoalId(subGoal.id);
          activeSessionsData[subGoal.id] = activeSession;

          // Get session stats
          const stats = await sessionsApi.getStats(subGoal.id);
          sessionStatsData[subGoal.id] = stats;
        } catch (error) {
          console.error(`Error loading session data for sub-goal ${subGoal.id}:`, error);
          activeSessionsData[subGoal.id] = null;
          sessionStatsData[subGoal.id] = {
            total_hours: 0,
            total_sessions: 0,
            avg_hours_per_session: 0,
            hours_expected: subGoal.hours_expected,
            completion_percentage: 0,
          };
        }
      }

      setActiveSessions(activeSessionsData);
      setSessionStats(sessionStatsData);
    } catch (error) {
      console.error('Error loading goal data:', error);
      setError('Failed to load goal data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    if (router.isReady && goalId) {
      loadGoalData();
    }
  }, [router.isReady, goalId, loadGoalData]);

  const handleCreateSubGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId) return;

    try {
      setSubGoalLoading(true);
      const newSubGoal = await subGoalsApi.create({
        ...subGoalForm,
        goal_id: goalId,
      });

      setSubGoals(prev => [...prev, newSubGoal]);
      setSubGoalForm({
        goal_id: goalId,
        title: '',
        description: '',
        hours_expected: 0,
        start_date: '01/01',
        end_date: '31/12',
      });
      setShowSubGoalForm(false);
      toast.success('Sub-goal created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create sub-goal');
    } finally {
      setSubGoalLoading(false);
    }
  };

  const handleStartSession = async (subGoalId: number) => {
    try {
      const session = await sessionsApi.start({ sub_goal_id: subGoalId });
      setActiveSessions(prev => ({ ...prev, [subGoalId]: session }));
      toast.success('Session started!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start session');
    }
  };

  const handleStopSession = async (subGoalId: number) => {
    try {
      const activeSession = activeSessions[subGoalId];
      if (!activeSession) return;

      await sessionsApi.stop(activeSession.id);
      setActiveSessions(prev => ({ ...prev, [subGoalId]: null }));
      
      // Reload session stats
      const stats = await sessionsApi.getStats(subGoalId);
      setSessionStats(prev => ({ ...prev, [subGoalId]: stats }));
      
      toast.success('Session stopped!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop session');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: `4px solid ${theme.primary}`,
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      </Layout>
    );
  }

  if (error && !goal) {
    return (
      <Layout>
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: `${theme.error}20`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="32"
              height="32"
              fill={theme.error}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '16px',
            }}
          >
            Failed to load goal
          </h2>
          <p
            style={{
              color: theme.textSecondary,
              marginBottom: '24px',
            }}
          >
            {error}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={loadGoalData}
              style={{
                background: theme.primary,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                background: theme.glassBg,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Back to Goals
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{goal?.title} - Personal Tracker</title>
        <meta name="description" content={`Details for goal: ${goal?.title}`} />
      </Head>

      <div style={{ minHeight: '100vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: theme.primary,
                textDecoration: 'none',
                marginBottom: '16px',
                padding: '8px 16px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                background: theme.glassBg,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Goals
            </Link>

            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: theme.text,
                marginBottom: '8px',
              }}
            >
              {goal?.title}
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: theme.textSecondary,
              }}
            >
              Year {goal?.year}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: `${theme.error}15`,
                border: `1px solid ${theme.error}30`,
                color: theme.error,
                padding: '16px 24px',
                borderRadius: '12px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Sub-goals Section */}
          <div
            style={{
              background: theme.surface,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: `0 10px 15px -3px ${theme.shadow}`,
              padding: '32px',
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  }}
                >
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: theme.text,
                      margin: 0,
                    }}
                  >
                    Sub-Goals ({subGoals.length})
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowSubGoalForm(!showSubGoalForm)}
                style={{
                  background: theme.primary,
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Sub-Goal
              </button>
            </div>

            {/* Sub-Goal Form */}
            {showSubGoalForm && (
              <form
                onSubmit={handleCreateSubGoal}
                style={{
                  background: theme.glassBg,
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme.text }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={subGoalForm.title}
                      onChange={(e) => setSubGoalForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        background: theme.surface,
                        color: theme.text,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme.text }}>
                      Target Hours *
                    </label>
                    <input
                      type="number"
                      value={subGoalForm.hours_expected}
                      onChange={(e) => setSubGoalForm(prev => ({ ...prev, hours_expected: parseInt(e.target.value) || 0 }))}
                      required
                      min="1"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        background: theme.surface,
                        color: theme.text,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme.text }}>
                    Description
                  </label>
                  <textarea
                    value={subGoalForm.description}
                    onChange={(e) => setSubGoalForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      background: theme.surface,
                      color: theme.text,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme.text }}>
                      Start Date (DD/MM)
                    </label>
                    <input
                      type="text"
                      value={subGoalForm.start_date}
                      onChange={(e) => setSubGoalForm(prev => ({ ...prev, start_date: e.target.value }))}
                      placeholder="01/01"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        background: theme.surface,
                        color: theme.text,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: theme.text }}>
                      End Date (DD/MM)
                    </label>
                    <input
                      type="text"
                      value={subGoalForm.end_date}
                      onChange={(e) => setSubGoalForm(prev => ({ ...prev, end_date: e.target.value }))}
                      placeholder="31/12"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        background: theme.surface,
                        color: theme.text,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={subGoalLoading}
                    style={{
                      background: theme.success,
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: subGoalLoading ? 'not-allowed' : 'pointer',
                      opacity: subGoalLoading ? 0.6 : 1,
                    }}
                  >
                    {subGoalLoading ? 'Creating...' : 'Create Sub-Goal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubGoalForm(false)}
                    style={{
                      background: theme.glassBg,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Sub-goals Grid */}
            {subGoals.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 32px',
                  background: theme.glassBg,
                  borderRadius: '16px',
                  border: `2px dashed ${theme.border}`,
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: `${theme.textSecondary}20`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="32" height="32" fill="none" stroke={theme.textSecondary} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '8px',
                  }}
                >
                  No sub-goals yet
                </h3>
                <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                  Create your first sub-goal to get started!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px',
                }}
              >
                {subGoals.map(subGoal => {
                  const activeSession = activeSessions[subGoal.id];
                  const stats = sessionStats[subGoal.id];
                  
                  // Add stats to subGoal for SubGoalCard
                  const subGoalWithStats = {
                    ...subGoal,
                    total_hours: stats?.total_hours || '0',
                    target_hours: stats?.hours_expected || subGoal.hours_expected || 0,
                  };

                  return (
                    <SubGoalCard
                      key={subGoal.id}
                      subGoal={subGoalWithStats}
                      onStartSession={handleStartSession}
                      onStopSession={handleStopSession}
                      onEdit={(subGoal) => {
                        toast.info('Edit functionality coming soon!');
                      }}
                      onDelete={async (subGoalId) => {
                        if (confirm('Are you sure you want to delete this sub-goal?')) {
                          try {
                            await subGoalsApi.delete(subGoalId);
                            setSubGoals(prev => prev.filter(sg => sg.id !== subGoalId));
                            toast.success('Sub-goal deleted successfully!');
                          } catch (error) {
                            toast.error('Failed to delete sub-goal');
                          }
                        }
                      }}
                      activeSessionId={activeSession?.id}
                      activeSession={activeSession}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
