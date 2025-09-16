import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { Goal } from '@/types/Goal';
import { SubGoal } from '@/types/SubGoal';
import { goalsApi, subGoalsApi, sessionsApi } from '@/lib/api';

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
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

      setReportData({
        totalGoals: goals.length,
        completedGoals,
        totalSubGoals,
        completedSubGoals,
        totalSessions,
        totalHours,
        averageSessionDuration,
        goalProgress,
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading reports...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Reports - Personal Routine Tracker</title>
      </Head>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>

          <div className="flex items-center gap-4">
            <label
              htmlFor="year-select"
              className="text-sm font-medium text-gray-700"
            >
              Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Total Goals
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {reportData.totalGoals}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.completedGoals} completed (
                  {formatPercentage(
                    reportData.totalGoals > 0
                      ? (reportData.completedGoals / reportData.totalGoals) *
                          100
                      : 0
                  )}
                  )
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Sub-Goals
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {reportData.totalSubGoals}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.completedSubGoals} completed (
                  {formatPercentage(
                    reportData.totalSubGoals > 0
                      ? (reportData.completedSubGoals /
                          reportData.totalSubGoals) *
                          100
                      : 0
                  )}
                  )
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Total Hours
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {formatHours(reportData.totalHours)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.totalSessions} sessions
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Avg Session
                </h3>
                <p className="text-3xl font-bold text-orange-600">
                  {formatHours(reportData.averageSessionDuration)}
                </p>
                <p className="text-sm text-gray-500 mt-1">per session</p>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Goal Progress
              </h2>

              {reportData.goalProgress.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No goals found for {selectedYear}
                </p>
              ) : (
                <div className="space-y-6">
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
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {goal.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Target Year: {goal.year}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {formatPercentage(completionRate)}
                            </p>
                            <p className="text-sm text-gray-500">completed</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>
                              {completedSubGoalsCount} / {subGoals.length}{' '}
                              sub-goals
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sub-goals: </span>
                            <span className="font-medium">
                              {subGoals.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total hours: </span>
                            <span className="font-medium">
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
      </div>
    </Layout>
  );
}
