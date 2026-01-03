import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useTheme } from '../contexts/ThemeContext';
import { gameApi } from '../lib/api/game';
import { UserGoal, GoalSubTask } from '../types/game';
import { useToast } from '../contexts/ToastContext';
import CapybaraBanner from '../components/CapybaraBanner';
import CapybaraFloating from '../components/CapybaraFloating';
import CapybaraLoader from '../components/CapybaraLoader';

interface GroupedGoal {
  goalId: number;
  goalTitle: string;
  goalYear: number;
  userGoals: (UserGoal & { subTasks: GoalSubTask[] })[];
}

interface GoalFormData {
  title: string;
  year: number;
}

interface CronJob {
  id: number;
  job_name: string;
  cron_expression: string;
  enabled: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const [groupedGoals, setGroupedGoals] = useState<GroupedGoal[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [editingCron, setEditingCron] = useState<{ job_name: string; hour: number; minute: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [newSubTask, setNewSubTask] = useState<{ userGoalId: number; title: string; minutes: number } | null>(null);
  const [editingGoal, setEditingGoal] = useState<{ id: number; title: string; year: number } | null>(null);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoalData, setNewGoalData] = useState<GoalFormData>({ title: '', year: new Date().getFullYear() });
  const toast = useToast();

  const loadData = React.useCallback(async (preserveScroll = false) => {
    // Save current scroll position if needed
    const scrollPosition = preserveScroll ? window.scrollY : 0;
    
    setLoading(true);
    try {
      console.log('[Settings] Starting to load data...');
      
      const [userGoals, allSubTasks, goals, cronJobsData] = await Promise.all([
        gameApi.getUserGoals().then(data => {
          console.log('[Settings] User goals loaded:', data.length);
          return data;
        }),
        gameApi.getGoalSubTasks().then(data => {
          console.log('[Settings] Sub-tasks loaded:', data.length);
          return data;
        }),
        gameApi.getGoals().then(data => {
          console.log('[Settings] Goals loaded:', data.length);
          return data;
        }).catch(err => {
          console.error('[Settings] Failed to fetch goals:', err);
          return []; // Return empty array if goals fetch fails
        }),
        fetch('/api/cron-config').then(res => res.json()).then(data => {
          console.log('[Settings] Cron jobs loaded:', data.data?.length || 0);
          return data.success ? data.data : [];
        }).catch(err => {
          console.error('[Settings] Failed to fetch cron jobs:', err);
          return [];
        }),
      ]);

      console.log('[Settings] All data loaded, grouping...');

      // Set cron jobs
      setCronJobs(cronJobsData);

      // Group by goal
      const grouped: Record<number, GroupedGoal> = {};
      
      userGoals.forEach(ug => {
        if (!grouped[ug.goal_id]) {
          const goal = goals.find(g => g.id === ug.goal_id);
          grouped[ug.goal_id] = {
            goalId: ug.goal_id,
            goalTitle: ug.goal_title,
            goalYear: goal?.year || new Date().getFullYear(),
            userGoals: [],
          };
        }
        
        const subTasks = allSubTasks.filter(st => st.user_goal_id === ug.id);
        grouped[ug.goal_id].userGoals.push({ ...ug, subTasks });
      });

      console.log('[Settings] Grouped goals:', Object.keys(grouped).length);
      setGroupedGoals(Object.values(grouped));
      
      // Expand all goals by default
      setExpandedGoals(new Set(Object.keys(grouped).map(Number)));
      
      // Restore scroll position after state update
      if (preserveScroll) {
        setTimeout(() => window.scrollTo(0, scrollPosition), 0);
      }
      
      console.log('[Settings] Data load complete');
    } catch (error) {
      console.error('[Settings Error] Failed to load data:', error);
      toast.error(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleGoal = (goalId: number) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleUpdateDuration = async (userId: number, goalId: number, hours: number) => {
    setSaving(userId);
    try {
      const minutes = hours * 60;
      await gameApi.updateUserGoal(userId, goalId, minutes);
      await loadData(true); // Preserve scroll position
      toast.success('Duration updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update duration');
    } finally {
      setSaving(null);
    }
  };

  const handleAddSubTask = async (userGoalId: number) => {
    if (!newSubTask || newSubTask.userGoalId !== userGoalId) {
      setNewSubTask({ userGoalId, title: '', minutes: 30 });
      return;
    }

    if (!newSubTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (newSubTask.minutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    try {
      await gameApi.createGoalSubTask(userGoalId, newSubTask.title, newSubTask.minutes);
      setNewSubTask(null);
      await loadData(true); // Preserve scroll position
      toast.success('Sub-task added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add sub-task');
    }
  };

  const handleDeleteSubTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sub-task?')) return;

    try {
      await gameApi.deleteGoalSubTask(id);
      await loadData(true); // Preserve scroll position
      toast.success('Sub-task deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sub-task');
    }
  };

  const getTotalSubTaskMinutes = (subTasks: GoalSubTask[]) => {
    return subTasks.reduce((sum, st) => sum + st.duration_minutes, 0);
  };

  const handleCreateGoal = async () => {
    if (!newGoalData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      await gameApi.createGoal(newGoalData.title, newGoalData.year);
      setCreatingGoal(false);
      setNewGoalData({ title: '', year: new Date().getFullYear() });
      await loadData(true);
      toast.success('Goal created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create goal');
    }
  };

  const handleUpdateGoal = async (id: number, title: string, year: number) => {
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      await gameApi.updateGoal(id, { title, year });
      setEditingGoal(null);
      await loadData(true);
      toast.success('Goal updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove all user goals and sub-tasks associated with it.`)) {
      return;
    }

    try {
      await gameApi.deleteGoal(id);
      await loadData(true);
      toast.success('Goal deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete goal');
    }
  };

  // Parse cron expression to get hour and minute
  const parseCronExpression = (expression: string): { hour: number; minute: number } => {
    const parts = expression.split(' ');
    return {
      minute: parseInt(parts[0]) || 0,
      hour: parseInt(parts[1]) || 0,
    };
  };

  // Convert hour and minute to cron expression
  const toCronExpression = (hour: number, minute: number): string => {
    return `${minute} ${hour} * * *`;
  };

  const handleUpdateCronSchedule = async (jobName: string, hour: number, minute: number) => {
    try {
      const cronExpression = toCronExpression(hour, minute);
      
      const response = await fetch(`/api/cron-config/${jobName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron_expression: cronExpression }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update schedule');
      }
      
      setEditingCron(null);
      await loadData(true);
      toast.success('Cron schedule updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cron schedule');
    }
  };

  const handleToggleCronJob = async (jobName: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/cron-config/${jobName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle job');
      }
      
      await loadData(true);
      toast.success(`Cron job ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle cron job');
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
          <CapybaraFloating position="top-right" size={100} />
          <CapybaraFloating position="bottom-left" size={110} />

          <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <CapybaraBanner 
              title="Game Settings" 
              subtitle="Configure daily goals and break them into smaller tasks"
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
                Daily Goals
              </h1>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: theme.textSecondary
                }}>
                  Each goal shows all players. Click to expand and manage sub-tasks.
                </p>
                <button
                  onClick={() => setCreatingGoal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    boxShadow: `0 4px 8px ${theme.shadow}`,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + New Goal
                </button>
              </div>

              {/* Create Goal Form */}
              {creatingGoal && (
                <div style={{
                  background: theme.background,
                  borderRadius: '1rem',
                  border: `2px solid ${theme.primary}`,
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '1rem'
                  }}>
                    Create New Goal
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Goal title (e.g., English Daily Practice)"
                      value={newGoalData.title}
                      onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                      style={{
                        flex: '1 1 300px',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: `2px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        background: theme.surface,
                        color: theme.text
                      }}
                    />
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={newGoalData.year}
                      onChange={(e) => setNewGoalData({ ...newGoalData, year: parseInt(e.target.value) })}
                      style={{
                        width: '120px',
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
                      onClick={handleCreateGoal}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: theme.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setCreatingGoal(false);
                        setNewGoalData({ title: '', year: new Date().getFullYear() });
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: theme.border,
                        color: theme.text,
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {groupedGoals.map(group => {
                  const isExpanded = expandedGoals.has(group.goalId);
                  const isEditing = editingGoal?.id === group.goalId;
                  
                  return (
                    <div key={group.goalId} style={{
                      background: theme.background,
                      borderRadius: '1rem',
                      border: `2px solid ${theme.border}`,
                      overflow: 'hidden'
                    }}>
                      {/* Goal Header */}
                      <div style={{
                        padding: '1.5rem',
                        background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`,
                        borderBottom: isExpanded ? `2px solid ${theme.border}` : 'none'
                      }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={editingGoal.title}
                              onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                              style={{
                                flex: '1 1 200px',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: `2px solid ${theme.border}`,
                                borderRadius: '0.5rem',
                                background: theme.surface,
                                color: theme.text
                              }}
                            />
                            <input
                              type="number"
                              min="2000"
                              max="2100"
                              value={editingGoal.year}
                              onChange={(e) => setEditingGoal({ ...editingGoal, year: parseInt(e.target.value) })}
                              style={{
                                width: '100px',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: `2px solid ${theme.border}`,
                                borderRadius: '0.5rem',
                                background: theme.surface,
                                color: theme.text
                              }}
                            />
                            <button
                              onClick={() => handleUpdateGoal(editingGoal.id, editingGoal.title, editingGoal.year)}
                              style={{
                                padding: '0.75rem 1rem',
                                background: theme.success,
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingGoal(null)}
                              style={{
                                padding: '0.75rem 1rem',
                                background: theme.border,
                                color: theme.text,
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}>
                            <div 
                              onClick={() => toggleGoal(group.goalId)}
                              style={{ 
                                cursor: 'pointer',
                                flex: '1 1 auto',
                                minWidth: '200px'
                              }}
                            >
                              <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: theme.text,
                                marginBottom: '0.25rem'
                              }}>
                                {group.goalTitle}
                              </h2>
                              <p style={{
                                fontSize: '0.875rem',
                                color: theme.textSecondary
                              }}>
                                {group.userGoals.length} player{group.userGoals.length !== 1 ? 's' : ''} • Year {group.goalYear}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGoal({ id: group.goalId, title: group.goalTitle, year: group.goalYear });
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: theme.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '600'
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGoal(group.goalId, group.goalTitle);
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: theme.error,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '600'
                                }}
                              >
                                🗑️ Delete
                              </button>
                              <div 
                                onClick={() => toggleGoal(group.goalId)}
                                style={{
                                  fontSize: '1.5rem',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease',
                                  cursor: 'pointer',
                                  padding: '0 0.5rem'
                                }}
                              >
                                ▼
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* User Goals */}
                      {isExpanded && (
                        <div style={{ 
                          padding: '1.5rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
                          gap: '1.5rem'
                        }}>
                          {group.userGoals.map(userGoal => {
                            const totalSubTaskMinutes = getTotalSubTaskMinutes(userGoal.subTasks);
                            const remainingMinutes = userGoal.daily_duration_minutes - totalSubTaskMinutes;
                            const isAddingSubTask = newSubTask?.userGoalId === userGoal.id;

                            return (
                              <div key={userGoal.id} style={{
                                padding: '1.5rem',
                                background: theme.surface,
                                borderRadius: '0.75rem',
                                border: `1px solid ${theme.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                              }}>
                                {/* User Header */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '1rem'
                                }}>
                                  <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: theme.text
                                  }}>
                                    {userGoal.user_name}
                                  </h3>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    color: theme.textSecondary
                                  }}>
                                    Total: {userGoal.daily_duration_hours}h ({userGoal.daily_duration_minutes}min)
                                  </div>
                                </div>

                                {/* Duration Control */}
                                <div style={{ marginBottom: '1rem' }}>
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
                                        setGroupedGoals(groupedGoals.map(g => ({
                                          ...g,
                                          userGoals: g.userGoals.map(ug =>
                                            ug.id === userGoal.id
                                              ? { ...ug, daily_duration_hours: newHours, daily_duration_minutes: newHours * 60 }
                                              : ug
                                          )
                                        })));
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        fontSize: '1rem',
                                        border: `2px solid ${theme.border}`,
                                        borderRadius: '0.5rem',
                                        outline: 'none',
                                        background: theme.background,
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
                                </div>

                                {/* Sub-Tasks */}
                                <div style={{
                                  marginTop: '1rem',
                                  padding: '1rem',
                                  background: theme.background,
                                  borderRadius: '0.5rem',
                                  border: `1px solid ${theme.border}`
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem'
                                  }}>
                                    <h4 style={{
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      color: theme.text
                                    }}>
                                      Sub-Tasks
                                    </h4>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: remainingMinutes >= 0 ? theme.success : theme.error
                                    }}>
                                      {remainingMinutes >= 0 ? `${remainingMinutes}min remaining` : `${Math.abs(remainingMinutes)}min over limit!`}
                                    </div>
                                  </div>

                                  {userGoal.subTasks.length === 0 && !isAddingSubTask && (
                                    <p style={{
                                      fontSize: '0.875rem',
                                      color: theme.textSecondary,
                                      fontStyle: 'italic',
                                      marginBottom: '0.75rem'
                                    }}>
                                      No sub-tasks yet. Break down this goal into smaller tasks!
                                    </p>
                                  )}

                                  {userGoal.subTasks.map(subTask => (
                                    <div key={subTask.id} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.75rem',
                                      background: theme.surface,
                                      borderRadius: '0.5rem',
                                      marginBottom: '0.5rem',
                                      border: `1px solid ${theme.border}`
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{
                                          fontSize: '0.875rem',
                                          fontWeight: '500',
                                          color: theme.text
                                        }}>
                                          {subTask.title}
                                        </div>
                                        <div style={{
                                          fontSize: '0.75rem',
                                          color: theme.textSecondary
                                        }}>
                                          {subTask.duration_minutes} minutes
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteSubTask(subTask.id)}
                                        style={{
                                          padding: '0.5rem',
                                          background: theme.error,
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '0.375rem',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem'
                                        }}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  ))}

                                  {/* Add Sub-Task Form */}
                                  {isAddingSubTask ? (
                                    <div style={{
                                      padding: '0.75rem',
                                      background: theme.surface,
                                      borderRadius: '0.5rem',
                                      border: `2px solid ${theme.primary}`,
                                      marginTop: '0.5rem'
                                    }}>
                                      <input
                                        type="text"
                                        placeholder="Task title (e.g., Speaking practice)"
                                        value={newSubTask.title}
                                        onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.5rem',
                                          fontSize: '0.875rem',
                                          border: `1px solid ${theme.border}`,
                                          borderRadius: '0.375rem',
                                          marginBottom: '0.5rem',
                                          background: theme.background,
                                          color: theme.text
                                        }}
                                      />
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                          type="number"
                                          min="5"
                                          step="5"
                                          value={newSubTask.minutes}
                                          onChange={(e) => setNewSubTask({ ...newSubTask, minutes: parseInt(e.target.value) })}
                                          style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            fontSize: '0.875rem',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '0.375rem',
                                            background: theme.background,
                                            color: theme.text
                                          }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>minutes</span>
                                        <button
                                          onClick={() => handleAddSubTask(userGoal.id)}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            background: theme.success,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                          }}
                                        >
                                          Add
                                        </button>
                                        <button
                                          onClick={() => setNewSubTask(null)}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            background: theme.border,
                                            color: theme.text,
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddSubTask(userGoal.id)}
                                      disabled={remainingMinutes <= 0}
                                      title={remainingMinutes <= 0 ? 'Cannot add more sub-tasks. Total duration would exceed the daily goal.' : 'Add a new sub-task'}
                                      style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: remainingMinutes <= 0 ? theme.border : theme.primary,
                                        color: remainingMinutes <= 0 ? theme.textSecondary : 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: remainingMinutes <= 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        marginTop: '0.5rem',
                                        opacity: remainingMinutes <= 0 ? 0.6 : 1,
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {remainingMinutes <= 0 ? '⚠️ Goal Full' : '+ Add Sub-Task'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cron Jobs Section */}
              <div style={{
                marginTop: '3rem',
                background: theme.surface,
                borderRadius: '1.5rem',
                boxShadow: `0 10px 25px ${theme.shadow}`,
                padding: '2.5rem',
                border: `1px solid ${theme.border}`
              }}>
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: theme.text,
                  marginBottom: '0.5rem'
                }}>
                  ⏰ Scheduled Jobs
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: theme.textSecondary,
                  marginBottom: '2rem'
                }}>
                  Manage automated tasks that run at specific times each day.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {cronJobs.map(job => {
                    const { hour, minute } = parseCronExpression(job.cron_expression);
                    const isEditing = editingCron?.job_name === job.job_name;
                    const displayName = job.job_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    
                    return (
                      <div key={job.job_name} style={{
                        background: theme.background,
                        borderRadius: '1rem',
                        border: `2px solid ${theme.border}`,
                        padding: '1.5rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: theme.text,
                                margin: 0
                              }}>
                                {displayName}
                              </h3>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                gap: '0.5rem'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={job.enabled}
                                  onChange={(e) => handleToggleCronJob(job.job_name, e.target.checked)}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{
                                  fontSize: '0.875rem',
                                  color: job.enabled ? theme.success : theme.textSecondary,
                                  fontWeight: '500'
                                }}>
                                  {job.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </div>
                            <p style={{
                              fontSize: '0.875rem',
                              color: theme.textSecondary,
                              margin: '0 0 0.75rem 0',
                              lineHeight: '1.5'
                            }}>
                              {job.description}
                            </p>
                            {job.last_run && (
                              <p style={{
                                fontSize: '0.75rem',
                                color: theme.textSecondary,
                                margin: 0
                              }}>
                                Last run: {new Date(job.last_run).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <div style={{ flex: '0 0 auto' }}>
                            {isEditing ? (
                              <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={editingCron.hour}
                                    onChange={(e) => setEditingCron({ ...editingCron, hour: parseInt(e.target.value) || 0 })}
                                    style={{
                                      width: '60px',
                                      padding: '0.5rem',
                                      fontSize: '1rem',
                                      border: `2px solid ${theme.border}`,
                                      borderRadius: '0.5rem',
                                      background: theme.surface,
                                      color: theme.text,
                                      textAlign: 'center'
                                    }}
                                  />
                                  <span style={{ color: theme.text, fontWeight: '600' }}>:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={editingCron.minute}
                                    onChange={(e) => setEditingCron({ ...editingCron, minute: parseInt(e.target.value) || 0 })}
                                    style={{
                                      width: '60px',
                                      padding: '0.5rem',
                                      fontSize: '1rem',
                                      border: `2px solid ${theme.border}`,
                                      borderRadius: '0.5rem',
                                      background: theme.surface,
                                      color: theme.text,
                                      textAlign: 'center'
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => handleUpdateCronSchedule(editingCron.job_name, editingCron.hour, editingCron.minute)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: theme.success,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCron(null)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: theme.border,
                                    color: theme.text,
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{
                                  padding: '0.75rem 1.25rem',
                                  background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`,
                                  borderRadius: '0.75rem',
                                  border: `2px solid ${theme.primary}30`
                                }}>
                                  <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: theme.primary,
                                    textAlign: 'center'
                                  }}>
                                    {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: theme.textSecondary,
                                    textAlign: 'center',
                                    marginTop: '0.25rem'
                                  }}>
                                    Daily
                                  </div>
                                </div>
                                <button
                                  onClick={() => setEditingCron({ job_name: job.job_name, hour, minute })}
                                  style={{
                                    padding: '0.75rem 1.25rem',
                                    background: theme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    boxShadow: `0 4px 8px ${theme.shadow}`,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  ✏️ Edit Time
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: `${theme.primary}15`,
                borderRadius: '0.75rem',
                border: `2px solid ${theme.primary}30`
              }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ color: theme.primary, fontSize: '1.25rem' }}>💡</div>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '0.25rem'
                    }}>
                      How Sub-Tasks Work
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.textSecondary,
                      lineHeight: '1.5'
                    }}>
                      Break down your daily goal into smaller tasks. For example, if you have 2 hours for "English Daily Practice", 
                      you can split it into "Speaking: 1h" and "Listening: 1h". The total of all sub-tasks must not exceed your daily goal duration.
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
