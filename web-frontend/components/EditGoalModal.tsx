import React, { useState, useEffect } from 'react';
import { Goal, UpdateGoalRequest } from '@/types/Goal';

interface EditGoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, goalData: UpdateGoalRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  goal,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<UpdateGoalRequest>({
    title: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        year: goal.year,
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal || !formData.title?.trim()) {
      return;
    }

    try {
      await onSubmit(goal.id, formData);
      onClose();
    } catch (error) {
      console.error('Edit form submission error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'year' ? parseInt(value) || new Date().getFullYear() : value,
    }));
  };

  if (!isOpen || !goal) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
            Edit Goal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
            }}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="edit-title" className="form-label">
              Goal Title *
            </label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your goal title..."
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-year" className="form-label">
              Target Year *
            </label>
            <input
              type="number"
              id="edit-year"
              name="year"
              value={formData.year || new Date().getFullYear()}
              onChange={handleInputChange}
              className="form-input"
              min="2000"
              max="2100"
              required
              disabled={loading}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.title?.trim()}
            >
              {loading ? 'Updating...' : 'Update Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;
