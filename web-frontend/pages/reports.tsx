import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useTheme } from '../contexts/ThemeContext';
import { goalsApi, subGoalsApi, sessionsApi } from '../lib/api';
import { Goal } from '../types/Goal';
import { SubGoal } from '../types/SubGoal';
import CapybaraBanner from '../components/CapybaraBanner';
import CapybaraFloating from '../components/CapybaraFloating';
import CapybaraLoader from '../components/CapybaraLoader';

interface ReportData {
  totalGoals: number;
  completedGoals: number;
  totalSubGoals: number;
  completedSubGoals: number;
  totalSessions: number;
  totalHours: number;
  averageSessionDuration: number;
  goalProgress: Array<{
    goal: Goal;
    subGoals: SubGoal[];
    totalHours: number;
    completionRate: number;
    completedSubGoalsCount: number;
  }>;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    streakDates: string[];
  };
  productivityInsights: {
    mostProductiveHour: number;
    mostProductiveDay: string;
    averageFocusTime: number;
    totalFocusTime: number;
  };
  weeklyPattern: Array<{
    day: string;
    hours: number;
    sessions: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    achieved: boolean;
    progress: number;
    icon: string;
  }>;
}

export default function Reports() {
  const { theme } = useTheme();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch goals for the selected year
        const goals = await goalsApi.getAll(selectedYear);

        let totalSubGoals = 0;
        let completedSubGoals = 0;
        let totalSessions = 0;
        let totalHours = 0;
        let completedGoals = 0;
        const goalProgress: Array<{
          goal: Goal;
          subGoals: SubGoal[];
          totalHours: number;
          completionRate: number;
          completedSubGoalsCount: number;
        }> = [];

        // Process each goal
        for (const goal of goals) {
          const subGoals = await subGoalsApi.getByGoalId(goal.id);
          totalSubGoals += subGoals.length;

          let goalTotalHours = 0;
          let completedSubGoalsCount = 0;

          // Process each sub-goal
          for (const subGoal of subGoals) {
            // For now, we don't have a status field, so we'll calculate completion based on sessions
            // This can be enhanced later when status field is added to SubGoal

            // Get sessions for this sub-goal
            const sessions = await sessionsApi.getBySubGoalId(subGoal.id);
            totalSessions += sessions.length;

            const subGoalHours = sessions.reduce((sum, session) => {
              return sum + (parseFloat(session.hours_spent?.toString() || '0') || 0);
            }, 0);

            goalTotalHours += subGoalHours;
            totalHours += subGoalHours;
          }

          const completionRate = subGoals.length > 0
            ? (completedSubGoalsCount / subGoals.length) * 100
            : 0;

          if (completionRate === 100) {
            completedGoals++;
          }

          goalProgress.push({
            goal,
            subGoals,
            totalHours: goalTotalHours,
            completionRate,
            completedSubGoalsCount,
          });
        }

        const averageSessionDuration = totalSessions > 0 ? totalHours / totalSessions : 0;

        setReportData({
          totalGoals: goals.length,
          completedGoals,
          totalSubGoals,
          completedSubGoals,
          totalSessions,
          totalHours,
          averageSessionDuration,
          goalProgress,
          streakData: { currentStreak: 0, longestStreak: 0, streakDates: [] },
          productivityInsights: {
            mostProductiveHour: 9,
            mostProductiveDay: 'Monday',
            averageFocusTime: averageSessionDuration,
            totalFocusTime: totalHours
          },
          weeklyPattern: [],
          achievements: []
        });

      } catch (err) {
        console.error('[Reports Error] Failed to load report data:', {
          selectedYear,
          error: err instanceof Error ? {
            message: err.message,
            stack: err.stack,
          } : err,
        });
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]);

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CapybaraLoader text="Loading your reports..." />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
              color: theme.error,
              fontSize: '1.125rem',
            }}
          >
            {error}
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Reports - Capybara Tracker</title>
        </Head>

        <div style={{ minHeight: '100vh', padding: '32px 16px', position: 'relative' }}>
          {/* Floating Capybara Decorations */}
          <CapybaraFloating position="top-left" size={90} />
          <CapybaraFloating position="bottom-right" size={120} />

          <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Capybara Banner */}
            <CapybaraBanner 
              title="Analytics Dashboard" 
              subtitle="Track your progress and insights"
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <label
                htmlFor="year-select"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.text,
                  marginRight: '12px'
                }}
              >
                Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '12px 16px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  background: theme.surface,
                  color: theme.text,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

          <div
            style={{
              background: theme.surface,
              borderRadius: '16px',
              padding: '32px',
              border: `1px solid ${theme.border}`,
              boxShadow: `0 4px 6px -1px ${theme.shadow}`,
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: theme.text,
                marginBottom: '24px',
              }}
            >
              📈 Reports Dashboard
            </h2>

            {reportData ? (
              <>
                {/* Overview Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
                    <p
                      style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: theme.primary,
                        marginBottom: '4px',
                      }}
                    >
                      {reportData.totalGoals}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                      Total Goals
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏱️</div>
                    <p
                      style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: theme.success,
                        marginBottom: '4px',
                      }}
                    >
                      {formatHours(reportData.totalHours)}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                      Focus Time
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                    <p
                      style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: '#f59e0b',
                        marginBottom: '4px',
                      }}
                    >
                      {reportData.totalSessions}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                      Total Sessions
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                    <p
                      style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: '#8b5cf6',
                        marginBottom: '4px',
                      }}
                    >
                      {reportData.completedGoals}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                      Completed Goals
                    </p>
                  </div>
                </div>

                {/* Goal Progress Section */}
                {reportData.goalProgress.length > 0 && (
                  <div
                    style={{
                      background: theme.surface,
                      borderRadius: '16px',
                      padding: '24px',
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                      marginBottom: '32px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: theme.text,
                        marginBottom: '16px',
                      }}
                    >
                      🎯 Goal Progress
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {reportData.goalProgress.map((progress) => (
                        <div
                          key={progress.goal.id}
                          style={{
                            padding: '16px',
                            background: theme.background,
                            borderRadius: '12px',
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: theme.text,
                              }}
                            >
                              {progress.goal.title}
                            </h4>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: progress.completionRate === 100 ? theme.success : theme.primary,
                              }}
                            >
                              {progress.completionRate.toFixed(0)}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '8px',
                              background: theme.border,
                              borderRadius: '4px',
                              overflow: 'hidden',
                              marginBottom: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: `${progress.completionRate}%`,
                                height: '100%',
                                background: progress.completionRate === 100 ? theme.success : theme.primary,
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              color: theme.textSecondary,
                            }}
                          >
                            <span>
                              {progress.completedSubGoalsCount}/{progress.subGoals.length} sub-goals
                            </span>
                            <span>{formatHours(progress.totalHours)} logged</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productivity Insights */}
                <div
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: theme.text,
                      marginBottom: '16px',
                    }}
                  >
                    💡 Productivity Insights
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⏰</div>
                      <p
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: theme.text,
                          marginBottom: '2px',
                        }}
                      >
                        {formatHours(reportData.averageSessionDuration)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                        Avg Session
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔥</div>
                      <p
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: theme.text,
                          marginBottom: '2px',
                        }}
                      >
                        {reportData.totalSubGoals}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                        Sub-Goals
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📈</div>
                      <p
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: theme.text,
                          marginBottom: '2px',
                        }}
                      >
                        {reportData.totalSubGoals > 0
                          ? ((reportData.completedSubGoals / reportData.totalSubGoals) * 100).toFixed(0)
                          : 0}%
                      </p>
                      <p style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                        Completion Rate
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: theme.textSecondary }}>
                  Loading report data...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}