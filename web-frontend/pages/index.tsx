import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Goal, CreateGoalRequest, UpdateGoalRequest } from '@/types/Goal';
import { goalsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import GoalForm from '@/components/GoalForm';
import GoalList from '@/components/GoalList';
import EditGoalModal from '@/components/EditGoalModal';

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load goals on component mount
  useEffect(() => {
    loadGoals();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMessage]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedGoals = await goalsApi.getAll();
      setGoals(fetchedGoals);
    } catch (error) {
      setError('Failed to load goals. Please try again.');
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goalData: CreateGoalRequest) => {
    try {
      setCreateLoading(true);
      setCreateError('');
      const newGoal = await goalsApi.create(goalData);
      setGoals(prev => [newGoal, ...prev]);
      setSuccessMessage('Goal created successfully!');
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : 'Failed to create goal'
      );
      throw error; // Re-throw to prevent form reset
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
    setUpdateError('');
  };

  const handleUpdateGoal = async (id: number, goalData: UpdateGoalRequest) => {
    try {
      setUpdateLoading(true);
      setUpdateError('');
      const updatedGoal = await goalsApi.update(id, goalData);
      setGoals(prev => prev.map(goal => (goal.id === id ? updatedGoal : goal)));
      setSuccessMessage('Goal updated successfully!');
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : 'Failed to update goal'
      );
      throw error; // Re-throw to prevent modal close
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await goalsApi.delete(id);
      setGoals(prev => prev.filter(goal => goal.id !== id));
      setSuccessMessage('Goal deleted successfully!');
    } catch (error) {
      setError('Failed to delete goal. Please try again.');
      console.error('Error deleting goal:', error);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGoal(null);
    setUpdateError('');
  };

  return (
    <Layout>
      <Head>
        <title>Personal Tracker - Your Goals</title>
        <meta
          name="description"
          content="Manage your goals and track your progress throughout the year"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Your Goals
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your dreams into achievable goals. Track your progress
              and celebrate your victories throughout the year.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8 shadow-soft animate-fade-in">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8 shadow-soft animate-fade-in">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 text-red-500"
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
                <button
                  onClick={loadGoals}
                  className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Create Goal Form */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(229, 231, 235, 0.5)',
            }}
          >
            <GoalForm
              onSubmit={handleCreateGoal}
              loading={createLoading}
              error={createError}
            />
          </div>

          {/* Goals List */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '2rem',
              border: '1px solid rgba(229, 231, 235, 0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0,
                    }}
                  >
                    Your Goals
                  </h2>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0,
                    }}
                  >
                    {goals.length} goal{goals.length !== 1 ? 's' : ''} in total
                  </p>
                </div>
              </div>

              {goals.length > 0 && (
                <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    Active Goals
                  </div>
                </div>
              )}
            </div>

            <GoalList
              goals={goals}
              loading={loading}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          </div>

          {/* Edit Goal Modal */}
          <EditGoalModal
            goal={editingGoal}
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSubmit={handleUpdateGoal}
            loading={updateLoading}
            error={updateError}
          />
        </div>
      </div>
    </Layout>
  );
}
