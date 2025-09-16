import React, { useState } from 'react';
import { CreateGoalRequest } from '@/types/Goal';

interface GoalFormProps {
  onSubmit: (goalData: CreateGoalRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<CreateGoalRequest>({
    title: '',
    year: new Date().getFullYear(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        title: '',
        year: new Date().getFullYear(),
      });
    } catch (error) {
      // Error is handled by parent component
      console.error('Form submission error:', error);
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

  return (
    <div>
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-red-500"
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
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700"
            >
              Goal Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="Enter your goal title..."
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="year"
              className="block text-sm font-semibold text-gray-700"
            >
              Target Year *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              min="2000"
              max="2100"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`btn-modern btn-primary-modern ${loading || !formData.title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading || !formData.title.trim()}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? (
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
              Create Goal
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default GoalForm;
