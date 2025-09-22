import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Goal, CreateGoalRequest, UpdateGoalRequest } from '@/types/Goal';
import { goalsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import GoalForm from '@/components/GoalForm';
import GoalCard from '@/components/GoalCard';
import EditGoalModal from '@/components/EditGoalModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

export default function Home() {
  const { theme } = useTheme();
  const toast = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load goals on component mount
  useEffect(() => {
    loadGoals();
  }, []);

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
      const newGoal = await goalsApi.create(goalData);
      setGoals(prev => [newGoal, ...prev]);
      toast.success('Goal created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
      throw error; // Re-throw to prevent form reset
    } finally {
      setCreateLoading(false);
    }
  };

  // const handleEditGoal = (goal: Goal) => {
  //   setEditingGoal(goal);
  //   setIsEditModalOpen(true);
  // };

  const handleUpdateGoal = async (id: number, goalData: UpdateGoalRequest) => {
    try {
      setUpdateLoading(true);
      const updatedGoal = await goalsApi.update(id, goalData);
      setGoals(prev => prev.map(goal => (goal.id === id ? updatedGoal : goal)));
      toast.success('Goal updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
      throw error; // Re-throw to prevent modal close
    } finally {
      setUpdateLoading(false);
    }
  };

  // const handleDeleteGoal = async (id: number) => {
  //   try {
  //     await goalsApi.delete(id);
  //     setGoals(prev => prev.filter(goal => goal.id !== id));
  //     toast.success('Goal deleted successfully!');
  //   } catch (error) {
  //     toast.error('Failed to delete goal. Please try again.');
  //     console.error('Error deleting goal:', error);
  //   }
  // };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGoal(null);
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

      <div style={{ minHeight: '100vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: '800',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '16px',
                lineHeight: '1.2',
              }}
            >
              Your Goals
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: theme.textSecondary,
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.6',
              }}
            >
              Transform your dreams into achievable goals. Track your progress
              and celebrate your victories throughout the year.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: `linear-gradient(135deg, ${theme.error}15, ${theme.error}10)`,
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
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
              <button
                onClick={loadGoals}
                style={{
                  marginLeft: 'auto',
                  color: theme.error,
                  textDecoration: 'underline',
                  fontWeight: '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Create Goal Form */}
          <div
            style={{
              background: theme.surface,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: `0 10px 15px -3px ${theme.shadow}`,
              padding: '32px',
              marginBottom: '32px',
              border: `1px solid ${theme.border}`,
            }}
          >
            <GoalForm
              onSubmit={handleCreateGoal}
              loading={createLoading}
              error=""
            />
          </div>

          {/* Goals Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${theme.success}, ${theme.primary})`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 6px -1px ${theme.shadow}`,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  Your Goals
                </h2>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: theme.textSecondary,
                    margin: 0,
                  }}
                >
                  {goals.length} goal{goals.length !== 1 ? 's' : ''} in total
                </p>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '24px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: `3px solid ${theme.primary}`,
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div
              style={{
                background: theme.surface,
                border: `2px dashed ${theme.border}`,
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}10)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  fill={theme.primary}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
                No goals yet
              </h3>
              <p
                style={{
                  color: theme.textSecondary,
                  fontSize: '0.875rem',
                }}
              >
                Create your first goal above to get started on your journey!
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}

          {/* Edit Goal Modal */}
          <EditGoalModal
            goal={editingGoal}
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSubmit={handleUpdateGoal}
            loading={updateLoading}
            error=""
          />
        </div>
      </div>
    </Layout>
  );
}
