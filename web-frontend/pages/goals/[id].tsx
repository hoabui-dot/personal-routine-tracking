import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import SessionTimer from '@/components/SessionTimer';
import { Goal } from '@/types/Goal';
import { SubGoal, CreateSubGoalRequest } from '@/types/SubGoal';
import { Session, SessionStats } from '@/types/Session';
import { goalsApi, subGoalsApi, sessionsApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function GoalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();

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
    if (!goalId) {
      setError('Invalid goal ID');
      setLoading(false);
      return;
    }

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
          const activeSession = await sessionsApi.getActiveBySubGoalId(
            subGoal.id
          );
          activeSessionsData[subGoal.id] = activeSession;

          const stats = await sessionsApi.getStats(subGoal.id);
          sessionStatsData[subGoal.id] = stats;
        } catch (err) {
          console.error(
            `Error loading session data for sub-goal ${subGoal.id}:`,
            err
          );
        }
      }

      setActiveSessions(activeSessionsData);
      setSessionStats(sessionStatsData);
    } catch (err) {
      console.error('Error loading goal data:', err);
      setError('Failed to load goal data');
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

    if (!goalId) {
      toast.error('Invalid goal ID');
      return;
    }

    if (!subGoalForm.title.trim()) {
      toast.error('Sub-goal title is required');
      return;
    }

    if (subGoalForm.hours_expected <= 0) {
      toast.error('Hours expected must be greater than 0');
      return;
    }

    try {
      setSubGoalLoading(true);
      setError('');

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
    } catch (err) {
      console.error('Error creating sub-goal:', err);
      toast.error('Failed to create sub-goal');
    } finally {
      setSubGoalLoading(false);
    }
  };

  const handleStartSession = async (subGoalId: number) => {
    try {
      const session = await sessionsApi.start({ sub_goal_id: subGoalId });
      setActiveSessions(prev => ({ ...prev, [subGoalId]: session }));
      toast.success('Session started!');
    } catch (err) {
      console.error('Error starting session:', err);
      toast.error('Failed to start session');
    }
  };

  const handleStopSession = async (subGoalId: number) => {
    const activeSession = activeSessions[subGoalId];
    if (!activeSession) return;

    try {
      await sessionsApi.stop(activeSession.id);
      setActiveSessions(prev => ({ ...prev, [subGoalId]: null }));

      // Reload stats
      const stats = await sessionsApi.getStats(subGoalId);
      setSessionStats(prev => ({ ...prev, [subGoalId]: stats }));

      toast.success('Session stopped!');
    } catch (err) {
      console.error('Error stopping session:', err);
      toast.error('Failed to stop session');
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '16rem',
            background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem 2rem',
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <svg
              className="animate-spin w-6 h-6 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span
              style={{
                fontSize: '1.125rem',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Loading goal details...
            </span>
          </div>
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
            background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)',
            minHeight: '16rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
            }}
          >
            <div
              style={{
                color: '#dc2626',
                marginBottom: '1rem',
                fontSize: '1.125rem',
              }}
            >
              {error}
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#3b82f6',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#eff6ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
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

      <div
        style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)',
          minHeight: '100vh',
          padding: '2rem 0',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#3b82f6',
                textDecoration: 'none',
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                transition: 'all 0.15s ease-in-out',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Goals
            </Link>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <svg
                    className="w-6 h-6 text-white"
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
                <div>
                  <h1
                    style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {goal?.title}
                  </h1>
                  <p
                    style={{
                      color: '#6b7280',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <svg
                        className="w-4 h-4"
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
                      Target Year: {goal?.year}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Created:{' '}
                      {goal && new Date(goal.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem 1.5rem',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
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
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0,
                  }}
                >
                  Sub-Goals ({subGoals.length})
                </h2>
              </div>
              <button
                onClick={() => setShowSubGoalForm(!showSubGoalForm)}
                className="btn-modern btn-primary-modern"
                style={{ fontSize: '0.875rem' }}
              >
                {showSubGoalForm ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Sub-Goal
                  </>
                )}
              </button>
            </div>

            {/* Sub-goal Form */}
            {showSubGoalForm && (
              <form
                onSubmit={handleCreateSubGoal}
                style={{
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={subGoalForm.title}
                      onChange={e =>
                        setSubGoalForm(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease-in-out',
                        background: 'rgba(255, 255, 255, 0.8)',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        e.target.style.outline = 'none';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Enter sub-goal title"
                      required
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={subGoalForm.description}
                      onChange={e =>
                        setSubGoalForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease-in-out',
                        background: 'rgba(255, 255, 255, 0.8)',
                        minHeight: '80px',
                        resize: 'vertical',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        e.target.style.outline = 'none';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Describe what you need to do for this sub-goal..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Hours Expected
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={subGoalForm.hours_expected}
                      onChange={e =>
                        setSubGoalForm(prev => ({
                          ...prev,
                          hours_expected: parseFloat(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease-in-out',
                        background: 'rgba(255, 255, 255, 0.8)',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        e.target.style.outline = 'none';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Start Date (DD/MM)
                      </label>
                      <input
                        type="text"
                        value={subGoalForm.start_date}
                        onChange={e =>
                          setSubGoalForm(prev => ({
                            ...prev,
                            start_date: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          transition: 'all 0.15s ease-in-out',
                          background: 'rgba(255, 255, 255, 0.8)',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow =
                            '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.outline = 'none';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="01/01"
                        pattern="\d{2}/\d{2}"
                        required
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem',
                        }}
                      >
                        End Date (DD/MM)
                      </label>
                      <input
                        type="text"
                        value={subGoalForm.end_date}
                        onChange={e =>
                          setSubGoalForm(prev => ({
                            ...prev,
                            end_date: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          transition: 'all 0.15s ease-in-out',
                          background: 'rgba(255, 255, 255, 0.8)',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow =
                            '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.outline = 'none';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="31/12"
                        pattern="\d{2}/\d{2}"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}
                >
                  <button
                    type="submit"
                    disabled={subGoalLoading}
                    className="btn-modern btn-primary-modern"
                    style={{
                      fontSize: '0.875rem',
                      opacity: subGoalLoading ? '0.5' : '1',
                      cursor: subGoalLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {subGoalLoading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create Sub-Goal
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Sub-goals List */}
            {subGoals.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: '#6b7280',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: '0.75rem',
                  border: '2px dashed #d1d5db',
                }}
              >
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
                    background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  }}
                >
                  No sub-goals yet
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Create your first sub-goal to get started!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {subGoals.map(subGoal => {
                  const activeSession = activeSessions[subGoal.id];
                  const stats = sessionStats[subGoal.id];

                  // Check if sub-goal is completed
                  const totalHours = parseFloat(String(stats?.total_hours || '0'));
                  const targetHours = parseFloat(String(stats?.hours_expected || '0'));
                  const isCompleted = totalHours >= targetHours;

                  return (
                    <div
                      key={subGoal.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow =
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem',
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: '#1f2937',
                              margin: 0,
                              marginBottom: '0.5rem',
                            }}
                          >
                            {subGoal.title}
                          </h3>
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <svg
                                className="w-4 h-4"
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
                              {subGoal.start_date || `${getMonthName(subGoal.start_month || 1)}`} -{' '}
                              {subGoal.end_date || `${getMonthName(subGoal.end_month || 12)}`}
                            </span>
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Target: {subGoal.hours_expected} hours
                            </span>
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isCompleted ? (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                fontSize: '1rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                              }}
                            >
                              <svg
                                width="20"
                                height="20"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              🎉 DONE
                            </div>
                          ) : activeSession ? (
                            <button
                              onClick={() => handleStopSession(subGoal.id)}
                              style={{
                                background:
                                  'linear-gradient(135deg, #dc2626, #ef4444)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform =
                                  'translateY(-1px)';
                                e.currentTarget.style.boxShadow =
                                  '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform =
                                  'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 4h12v16H6z" />
                              </svg>
                              Stop Session
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartSession(subGoal.id)}
                              style={{
                                background:
                                  'linear-gradient(135deg, #16a34a, #22c55e)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform =
                                  'translateY(-1px)';
                                e.currentTarget.style.boxShadow =
                                  '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform =
                                  'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Start Session
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Session Timer */}
                      {stats && (
                        <div style={{ marginBottom: '1rem' }}>
                          <SessionTimer
                            activeSession={activeSession}
                            totalHours={parseFloat(String(stats.total_hours || '0'))}
                            targetHours={parseFloat(String(stats.hours_expected || '0'))}
                          />
                        </div>
                      )}

                      {stats && (
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <svg
                              className="w-4 h-4"
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
                            Sessions: {stats.total_sessions}
                          </span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            Avg: {parseFloat(String(stats.avg_hours_per_session || '0')).toFixed(1)}h per
                            session
                          </span>
                        </div>
                      )}
                    </div>
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
