import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { Goal } from '@/types/Goal';
import { SubGoal } from '@/types/SubGoal';
import { Session } from '@/types/Session';
import { goalsApi, subGoalsApi, sessionsApi } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

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
  // Enhanced analytics
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
  monthlyProgress: Array<{
    month: string;
    hours: number;
    goals: number;
    completion: number;
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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'achievements'>('overview');

  // Helper functions for advanced analytics
  const calculateStreakData = (sessions: Session[]) => {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, streakDates: [] };
    }

    // Sort sessions by date
    const sortedSessions = sessions
      .filter(s => s.ended_at)
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    const uniqueDates = [...new Set(sortedSessions.map(s =>
      new Date(s.started_at).toDateString()
    ))];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate streaks
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      let streakCount = 0;
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i]);
        const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff <= streakCount + 1) {
          streakCount++;
        } else {
          break;
        }
      }
      currentStreak = streakCount;
    }

    return {
      currentStreak,
      longestStreak,
      streakDates: uniqueDates.slice(-7) // Last 7 days
    };
  };

  const calculateProductivityInsights = (sessions: Session[]) => {
    if (sessions.length === 0) {
      return {
        mostProductiveHour: 9,
        mostProductiveDay: 'Monday',
        averageFocusTime: 0,
        totalFocusTime: 0
      };
    }

    const hourCounts: { [hour: number]: number } = {};
    const dayCounts: { [day: string]: number } = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let totalFocusTime = 0;
    let focusSessions = 0;

    sessions.forEach(session => {
      if (session.ended_at) {
        const startDate = new Date(session.started_at);
        const endDate = new Date(session.ended_at);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

        const hour = startDate.getHours();
        const day = days[startDate.getDay()];

        hourCounts[hour] = (hourCounts[hour] || 0) + duration;
        dayCounts[day] = (dayCounts[day] || 0) + duration;

        totalFocusTime += duration;
        focusSessions++;
      }
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '9';

    const mostProductiveDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

    return {
      mostProductiveHour: parseInt(mostProductiveHour),
      mostProductiveDay,
      averageFocusTime: focusSessions > 0 ? totalFocusTime / focusSessions : 0,
      totalFocusTime
    };
  };

  const calculateWeeklyPattern = (sessions: Session[]) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = days.map(day => ({ day, hours: 0, sessions: 0 }));

    sessions.forEach(session => {
      if (session.ended_at) {
        const startDate = new Date(session.started_at);
        const endDate = new Date(session.ended_at);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const dayIndex = startDate.getDay();

        weeklyData[dayIndex].hours += duration;
        weeklyData[dayIndex].sessions += 1;
      }
    });

    return weeklyData;
  };

  const generateAchievements = (reportData: Partial<ReportData>) => {
    const achievements = [
      {
        id: 'first-goal',
        title: 'Goal Setter',
        description: 'Create your first goal',
        achieved: (reportData.totalGoals || 0) >= 1,
        progress: Math.min((reportData.totalGoals || 0) / 1 * 100, 100),
        icon: '🎯'
      },
      {
        id: 'consistent-week',
        title: 'Consistent Week',
        description: 'Work on goals for 7 consecutive days',
        achieved: (reportData.streakData?.currentStreak || 0) >= 7,
        progress: Math.min((reportData.streakData?.currentStreak || 0) / 7 * 100, 100),
        icon: '🔥'
      },
      {
        id: 'hundred-hours',
        title: 'Century Club',
        description: 'Complete 100 hours of focused work',
        achieved: (reportData.totalHours || 0) >= 100,
        progress: Math.min((reportData.totalHours || 0) / 100 * 100, 100),
        icon: '💯'
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Most productive hour is before 9 AM',
        achieved: (reportData.productivityInsights?.mostProductiveHour || 12) < 9,
        progress: (reportData.productivityInsights?.mostProductiveHour || 12) < 9 ? 100 : 0,
        icon: '🌅'
      },
      {
        id: 'goal-crusher',
        title: 'Goal Crusher',
        description: 'Complete 5 goals',
        achieved: (reportData.completedGoals || 0) >= 5,
        progress: Math.min((reportData.completedGoals || 0) / 5 * 100, 100),
        icon: '🏆'
      }
    ];

    return achievements;
  };

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Load all goals for the selected year
      const goals = await goalsApi.getAll(selectedYear);

      let totalSubGoals = 0;
      let completedSubGoals = 0;
      let totalSessions = 0;
      let totalHours = 0;
      let allSessions: Session[] = [];
      const goalProgress: Array<{
        goal: Goal;
        subGoals: SubGoal[];
        totalHours: number;
        completionRate: number;
        completedSubGoalsCount: number;
      }> = [];

      for (const goal of goals) {
        // Load sub-goals for each goal
        const subGoals = await subGoalsApi.getByGoalId(goal.id);

        totalSubGoals += subGoals.length;

        let goalTotalHours = 0;
        for (const subGoal of subGoals) {
          // Load sessions for each sub-goal
          const sessions = await sessionsApi.getBySubGoalId(subGoal.id);

          totalSessions += sessions.length;
          allSessions = [...allSessions, ...sessions];

          const subGoalHours = sessions.reduce((sum, session) => {
            if (session.ended_at) {
              const duration =
                (new Date(session.ended_at).getTime() -
                  new Date(session.started_at).getTime()) /
                (1000 * 60 * 60);
              return sum + duration;
            }
            return sum;
          }, 0);

          goalTotalHours += subGoalHours;
        }

        totalHours += goalTotalHours;

        // Calculate completion rate based on hours spent vs expected
        let completedSubGoalsCount = 0;
        for (const subGoal of subGoals) {
          const sessions = await sessionsApi.getBySubGoalId(subGoal.id);
          const totalHoursSpent = sessions.reduce((sum, session) => {
            if (session.ended_at) {
              const duration =
                (new Date(session.ended_at).getTime() -
                  new Date(session.started_at).getTime()) /
                (1000 * 60 * 60);
              return sum + duration;
            }
            return sum;
          }, 0);

          // Consider completed if spent hours >= expected hours
          if (totalHoursSpent >= subGoal.hours_expected) {
            completedSubGoalsCount++;
          }
        }

        completedSubGoals += completedSubGoalsCount;
        const completionRate =
          subGoals.length > 0
            ? (completedSubGoalsCount / subGoals.length) * 100
            : 0;

        goalProgress.push({
          goal,
          subGoals,
          totalHours: goalTotalHours,
          completionRate,
          completedSubGoalsCount,
        });
      }

      const completedGoals = goals.filter(
        g =>
          goalProgress.find(gp => gp.goal.id === g.id)?.completionRate === 100
      ).length;

      const averageSessionDuration =
        totalSessions > 0 ? totalHours / totalSessions : 0;

      // Calculate advanced analytics
      const streakData = calculateStreakData(allSessions);
      const productivityInsights = calculateProductivityInsights(allSessions);
      const weeklyPattern = calculateWeeklyPattern(allSessions);

      // Generate monthly progress (simplified for now)
      const monthlyProgress = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        hours: Math.random() * 20, // Placeholder - would calculate from actual data
        goals: Math.floor(Math.random() * 3),
        completion: Math.random() * 100
      }));

      const baseReportData = {
        totalGoals: goals.length,
        completedGoals,
        totalSubGoals,
        completedSubGoals,
        totalSessions,
        totalHours,
        averageSessionDuration,
        goalProgress,
        streakData,
        productivityInsights,
        weeklyPattern,
        monthlyProgress,
        achievements: []
      };

      const achievements = generateAchievements(baseReportData);

      setReportData({
        ...baseReportData,
        achievements
      });
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
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

  if (error) {
    return (
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
    );
  }

  return (
    <Layout>
      <Head>
        <title>Reports - Personal Routine Tracker</title>
      </Head>

      <div style={{ minHeight: '100vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: theme.text,
                  marginBottom: '8px',
                }}
              >
                📊 Analytics Dashboard
              </h1>
              <p
                style={{
                  fontSize: '1.125rem',
                  color: theme.textSecondary,
                }}
              >
                Track your progress and insights
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label
                htmlFor="year-select"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.text,
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
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '32px',
              background: theme.glassBg,
              padding: '8px',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
            }}
          >
            {[
              { key: 'overview', label: '📈 Overview', icon: '📈' },
              { key: 'analytics', label: '🔍 Analytics', icon: '🔍' },
              { key: 'achievements', label: '🏆 Achievements', icon: '🏆' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === tab.key ? theme.primary : 'transparent',
                  color: activeTab === tab.key ? 'white' : theme.text,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        {reportData && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Enhanced Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                  }}
                >
                  {/* Total Goals Card */}
                  <div
                    style={{
                      background: theme.surface,
                      padding: '24px',
                      borderRadius: '16px',
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}10)`,
                        borderRadius: '0 16px 0 80px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        🎯
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: theme.text,
                            margin: 0,
                          }}
                        >
                          Total Goals
                        </h3>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: theme.textSecondary,
                            margin: 0,
                          }}
                        >
                          Your objectives
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: theme.primary,
                        margin: '0 0 8px 0',
                      }}
                    >
                      {reportData.totalGoals}
                    </p>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      {reportData.completedGoals} completed ({formatPercentage(
                        reportData.totalGoals > 0
                          ? (reportData.completedGoals / reportData.totalGoals) * 100
                          : 0
                      )})
                    </p>
                  </div>

                  {/* Focus Time Card */}
                  <div
                    style={{
                      background: theme.surface,
                      padding: '24px',
                      borderRadius: '16px',
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: `linear-gradient(135deg, ${theme.success}20, ${theme.success}10)`,
                        borderRadius: '0 16px 0 80px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, ${theme.success}, #10b981)`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        ⏱️
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: theme.text,
                            margin: 0,
                          }}
                        >
                          Focus Time
                        </h3>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: theme.textSecondary,
                            margin: 0,
                          }}
                        >
                          Total hours
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: theme.success,
                        margin: '0 0 8px 0',
                      }}
                    >
                      {formatHours(reportData.totalHours)}
                    </p>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      {reportData.totalSessions} sessions • Avg {formatTime(reportData.averageSessionDuration)}
                    </p>
                  </div>

                  {/* Current Streak Card */}
                  <div
                    style={{
                      background: theme.surface,
                      padding: '24px',
                      borderRadius: '16px',
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: `linear-gradient(135deg, #f59e0b20, #f59e0b10)`,
                        borderRadius: '0 16px 0 80px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        🔥
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: theme.text,
                            margin: 0,
                          }}
                        >
                          Current Streak
                        </h3>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: theme.textSecondary,
                            margin: 0,
                          }}
                        >
                          Consecutive days
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: '#f59e0b',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {reportData.streakData.currentStreak}
                    </p>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      Best: {reportData.streakData.longestStreak} days
                    </p>
                  </div>

                  {/* Productivity Insights Card */}
                  <div
                    style={{
                      background: theme.surface,
                      padding: '24px',
                      borderRadius: '16px',
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: `linear-gradient(135deg, #8b5cf620, #8b5cf610)`,
                        borderRadius: '0 16px 0 80px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        📈
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: theme.text,
                            margin: 0,
                          }}
                        >
                          Peak Hour
                        </h3>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: theme.textSecondary,
                            margin: 0,
                          }}
                        >
                          Most productive
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: '#8b5cf6',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {reportData.productivityInsights.mostProductiveHour}:00
                    </p>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      Best day: {reportData.productivityInsights.mostProductiveDay}
                    </p>
                  </div>
                </div>

                {/* Weekly Pattern */}
                <div
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '32px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                    marginBottom: '32px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      📅
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
                        Weekly Pattern
                      </h2>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: theme.textSecondary,
                          margin: 0,
                        }}
                      >
                        Your productivity throughout the week
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '12px',
                    }}
                  >
                    {reportData.weeklyPattern.map((day, index) => {
                      const maxHours = Math.max(...reportData.weeklyPattern.map(d => d.hours));
                      const heightPercentage = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;

                      return (
                        <div
                          key={day.day}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '120px',
                              background: theme.glassBg,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              padding: '4px',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                height: `${heightPercentage}%`,
                                background: `linear-gradient(180deg, ${theme.primary}, ${theme.primaryHover})`,
                                borderRadius: '4px',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              {day.hours > 0 && formatTime(day.hours)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: theme.text,
                                margin: '0 0 2px 0',
                              }}
                            >
                              {day.day.slice(0, 3)}
                            </p>
                            <p
                              style={{
                                fontSize: '0.625rem',
                                color: theme.textSecondary,
                                margin: 0,
                              }}
                            >
                              {day.sessions} sessions
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Goal Progress */}
                <div
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '32px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, ${theme.success}, #10b981)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      🎯
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
                        Goal Progress
                      </h2>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: theme.textSecondary,
                          margin: 0,
                        }}
                      >
                        Track your objectives completion
                      </p>
                    </div>
                  </div>

                  {reportData.goalProgress.length === 0 ? (
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
                          fontSize: '3rem',
                          marginBottom: '16px',
                        }}
                      >
                        🎯
                      </div>
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: theme.text,
                          marginBottom: '8px',
                        }}
                      >
                        No goals found for {selectedYear}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Create your first goal to start tracking progress!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {reportData.goalProgress.map(
                        ({
                          goal,
                          subGoals,
                          totalHours,
                          completionRate,
                          completedSubGoalsCount,
                        }) => (
                          <div
                            key={goal.id}
                            style={{
                              background: theme.glassBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '16px',
                              padding: '24px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '20px',
                                flexWrap: 'wrap',
                                gap: '16px',
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: theme.text,
                                    marginBottom: '4px',
                                  }}
                                >
                                  {goal.title}
                                </h3>
                                <p
                                  style={{
                                    fontSize: '0.875rem',
                                    color: theme.textSecondary,
                                  }}
                                >
                                  Target Year: {goal.year}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p
                                  style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: completionRate === 100 ? theme.success : theme.primary,
                                    marginBottom: '4px',
                                  }}
                                >
                                  {formatPercentage(completionRate)}
                                </p>
                                <p
                                  style={{
                                    fontSize: '0.75rem',
                                    color: theme.textSecondary,
                                  }}
                                >
                                  completed
                                </p>
                              </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.875rem',
                                  color: theme.textSecondary,
                                  marginBottom: '8px',
                                }}
                              >
                                <span>Progress</span>
                                <span>
                                  {completedSubGoalsCount} / {subGoals.length} sub-goals
                                </span>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: '8px',
                                  background: theme.glassBg,
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})`,
                                    borderRadius: '4px',
                                    width: `${completionRate}%`,
                                    transition: 'all 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                gap: '16px',
                                fontSize: '0.875rem',
                              }}
                            >
                              <div>
                                <span style={{ color: theme.textSecondary }}>Sub-goals: </span>
                                <span style={{ fontWeight: '600', color: theme.text }}>
                                  {subGoals.length}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: theme.textSecondary }}>Total hours: </span>
                                <span style={{ fontWeight: '600', color: theme.text }}>
                                  {formatHours(totalHours)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Productivity Insights */}
                <div
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '32px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      🧠
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
                        Productivity Insights
                      </h2>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: theme.textSecondary,
                          margin: 0,
                        }}
                      >
                        Understand your work patterns
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    <div
                      style={{
                        background: theme.glassBg,
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏰</div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        Peak Hour
                      </h3>
                      <p
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: theme.primary,
                          marginBottom: '4px',
                        }}
                      >
                        {reportData.productivityInsights.mostProductiveHour}:00
                      </p>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Most productive hour
                      </p>
                    </div>

                    <div
                      style={{
                        background: theme.glassBg,
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        Best Day
                      </h3>
                      <p
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: theme.success,
                          marginBottom: '4px',
                        }}
                      >
                        {reportData.productivityInsights.mostProductiveDay}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Most productive day
                      </p>
                    </div>

                    <div
                      style={{
                        background: theme.glassBg,
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        Avg Focus
                      </h3>
                      <p
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#f59e0b',
                          marginBottom: '4px',
                        }}
                      >
                        {formatTime(reportData.productivityInsights.averageFocusTime)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Per session
                      </p>
                    </div>
                  </div>
                </div>

                {/* Streak Analysis */}
                <div
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '32px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      🔥
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
                        Streak Analysis
                      </h2>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: theme.textSecondary,
                          margin: 0,
                        }}
                      >
                        Your consistency over time
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '24px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔥</div>
                      <p
                        style={{
                          fontSize: '2rem',
                          fontWeight: '800',
                          color: '#f59e0b',
                          marginBottom: '4px',
                        }}
                      >
                        {reportData.streakData.currentStreak}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Current Streak (days)
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
                      <p
                        style={{
                          fontSize: '2rem',
                          fontWeight: '800',
                          color: theme.primary,
                          marginBottom: '4px',
                        }}
                      >
                        {reportData.streakData.longestStreak}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>
                        Longest Streak (days)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div
                style={{
                  background: theme.surface,
                  borderRadius: '16px',
                  padding: '32px',
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    🏆
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
                      Achievements
                    </h2>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      Your milestones and accomplishments
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {reportData.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      style={{
                        background: achievement.achieved ? theme.glassBg : `${theme.glassBg}80`,
                        border: `1px solid ${achievement.achieved ? theme.success : theme.border}`,
                        borderRadius: '16px',
                        padding: '24px',
                        position: 'relative',
                        opacity: achievement.achieved ? 1 : 0.7,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {achievement.achieved && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '24px',
                            height: '24px',
                            background: theme.success,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          ✓
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div
                          style={{
                            fontSize: '2.5rem',
                            filter: achievement.achieved ? 'none' : 'grayscale(100%)',
                          }}
                        >
                          {achievement.icon}
                        </div>
                        <div>
                          <h3
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: theme.text,
                              marginBottom: '4px',
                            }}
                          >
                            {achievement.title}
                          </h3>
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: theme.textSecondary,
                              margin: 0,
                            }}
                          >
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: theme.textSecondary,
                            marginBottom: '4px',
                          }}
                        >
                          <span>Progress</span>
                          <span>{Math.round(achievement.progress)}%</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: theme.glassBg,
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              background: achievement.achieved
                                ? `linear-gradient(90deg, ${theme.success}, #10b981)`
                                : `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})`,
                              borderRadius: '3px',
                              width: `${achievement.progress}%`,
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
