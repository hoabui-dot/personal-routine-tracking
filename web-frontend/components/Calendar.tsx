import React, { useState, useEffect } from 'react';
import { Note } from '../types/note';
import { notesApi } from '../lib/api/notes';
import { useToast } from '../contexts/ToastContext';

interface CalendarProps {
  onDateSelect?: (date: string) => void;
}

// Separate Components theo requirement
const CalendarHeader: React.FC<{
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}> = ({ month, year, onPrevMonth, onNextMonth, onToday }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2rem'
    }}>
      <div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#0f172a',
          marginBottom: '0.5rem',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          {monthNames[month]} {year}
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          Click any date to add notes
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={onToday}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#475569',
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
            fontFamily: 'Inter, -apple-system, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Today
        </button>
        
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: 'white',
          border: '1px solid #cbd5e1',
          borderRadius: '0.75rem',
          padding: '0.25rem'
        }}>
          <button
            onClick={onPrevMonth}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#64748b',
              transition: 'all 0.2s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Previous month"
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={onNextMonth}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#64748b',
              transition: 'all 0.2s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Next month"
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarCell: React.FC<{
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  hasNote: boolean;
  onClick: () => void;
}> = ({ day, isToday, isSelected, hasNote, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (day === null) {
    return <div style={{ aspectRatio: '1' }} />;
  }

  const getBackgroundColor = () => {
    if (isSelected) return '#6366f1';
    if (hasNote) return '#f0fdf4';
    if (isHovered) return '#f8fafc';
    return 'white';
  };

  const getBorderColor = () => {
    if (isToday) return '#6366f1';
    if (isSelected) return '#6366f1';
    return '#e2e8f0';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: '1',
        padding: '0.75rem',
        borderRadius: '1rem',
        border: `2px solid ${getBorderColor()}`,
        background: getBackgroundColor(),
        color: isSelected ? 'white' : '#0f172a',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease-out',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSelected ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : isHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        transform: isHovered || isSelected ? 'scale(1.02)' : 'scale(1)',
        fontFamily: 'Inter, -apple-system, sans-serif'
      }}
    >
      {day}
      {hasNote && (
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          width: '0.375rem',
          height: '0.375rem',
          borderRadius: '50%',
          background: isSelected ? 'white' : '#22c55e'
        }} />
      )}
    </button>
  );
};

const CalendarGrid: React.FC<{
  days: (number | null)[];
  year: number;
  month: number;
  today: string;
  selectedDate: string | null;
  notes: Record<string, Note>;
  onDateClick: (day: number) => void;
  formatDate: (date: Date) => string;
}> = ({ days, year, month, today, selectedDate, notes, onDateClick, formatDate }) => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      {/* Day Names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        {dayNames.map((day) => (
          <div key={day} style={{
            textAlign: 'center',
            padding: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            fontFamily: 'Inter, -apple-system, sans-serif'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - 7 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
          }

          const dateStr = formatDate(new Date(year, month, day));
          const hasNote = !!notes[dateStr];
          const isSelected = selectedDate === dateStr;
          const isToday = today === dateStr;

          return (
            <CalendarCell
              key={day}
              day={day}
              isToday={isToday}
              isSelected={isSelected}
              hasNote={hasNote}
              onClick={() => onDateClick(day)}
            />
          );
        })}
      </div>
    </div>
  );
};

const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const toast = useToast();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const loadMonthNotes = React.useCallback(async () => {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const monthNotes = await notesApi.getNotes({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });

      const notesMap: Record<string, Note> = {};
      monthNotes.forEach((note) => {
        notesMap[note.date] = note;
      });
      setNotes(notesMap);
    } catch (error) {
      console.error('[Calendar Error] Failed to load notes:', {
        year,
        month,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
    }
  }, [year, month]);

  useEffect(() => {
    loadMonthNotes();
  }, [loadMonthNotes]);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday start

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
    setShowNotePanel(false);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
    setShowNotePanel(false);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setShowNotePanel(false);
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(new Date(year, month, day));
    setSelectedDate(dateStr);
    setShowNotePanel(true);
    
    const existingNote = notes[dateStr];
    if (existingNote) {
      setNoteContent(existingNote.content);
      setIsEditing(false);
    } else {
      setNoteContent('');
      setIsEditing(true);
    }

    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedDate || !noteContent.trim()) {
      toast.error('Please enter note content');
      return;
    }

    setLoading(true);
    try {
      const existingNote = notes[selectedDate];
      
      if (existingNote) {
        const updatedNote = await notesApi.updateNote(existingNote.id, {
          content: noteContent,
        });
        setNotes({ ...notes, [selectedDate]: updatedNote });
        toast.success('Note updated successfully');
      } else {
        const newNote = await notesApi.createNote({
          title: `Note for ${selectedDate}`,
          type: 'richtext',
          date: selectedDate,
          content: noteContent,
        });
        setNotes({ ...notes, [selectedDate]: newNote });
        toast.success('Note created successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('[Calendar Error] Failed to save note:', {
        selectedDate,
        hasExistingNote: !!notes[selectedDate],
        contentLength: noteContent.length,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedDate || !notes[selectedDate]) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      await notesApi.deleteNote(notes[selectedDate].id);
      const newNotes = { ...notes };
      delete newNotes[selectedDate];
      setNotes(newNotes);
      setNoteContent('');
      setIsEditing(false);
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('[Calendar Error] Failed to delete note:', {
        selectedDate,
        noteId: notes[selectedDate]?.id,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const days = getDaysInMonth();
  const today = formatDate(new Date());

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        {/* Calendar Card - Card-style với shadow */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '2.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <CalendarHeader
            month={month}
            year={year}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
          
          <CalendarGrid
            days={days}
            year={year}
            month={month}
            today={today}
            selectedDate={selectedDate}
            notes={notes}
            onDateClick={handleDateClick}
            formatDate={formatDate}
          />
        </div>

        {/* Side Panel - Slide-in từ phải */}
        {selectedDate && showNotePanel && (
          <>
            {/* Backdrop */}
            <div 
              onClick={() => setShowNotePanel(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(4px)',
                zIndex: 40,
                animation: 'fadeIn 0.3s ease-out'
              }}
            />
            
            {/* Panel */}
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100%',
              width: '480px',
              maxWidth: '100%',
              background: 'white',
              boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1), -4px 0 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              animation: 'slideInRight 0.3s ease-out'
            }}>
              {/* Panel Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '2rem',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    marginBottom: '0.5rem',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                  }}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                  }}>
                    {isEditing ? 'Editing note' : notes[selectedDate] ? 'View note' : 'Add a new note'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowNotePanel(false);
                    setSelectedDate(null);
                    setIsEditing(false);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    transition: 'all 0.2s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#64748b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Panel Content */}
              <div style={{
                flex: 1,
                padding: '2rem',
                overflowY: 'auto'
              }}>
                {isEditing ? (
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your thoughts, tasks, or reminders..."
                    disabled={loading}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '400px',
                      padding: '1.25rem',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '1rem',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      transition: 'all 0.2s ease-out'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                ) : (
                  <div>
                    {noteContent ? (
                      <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '1rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <p style={{
                          whiteSpace: 'pre-wrap',
                          color: '#334155',
                          lineHeight: '1.7',
                          fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                          {noteContent}
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem 0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          marginBottom: '1rem',
                          borderRadius: '1rem',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg style={{ width: '2rem', height: '2rem', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <p style={{ 
                          color: '#64748b', 
                          fontWeight: '500',
                          fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                          No note yet
                        </p>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#94a3b8', 
                          marginTop: '0.5rem',
                          fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                          Click "Add Note" to start writing
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Panel Actions */}
              <div style={{
                padding: '2rem',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleSaveNote}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.875rem 1.5rem',
                        background: '#6366f1',
                        color: 'white',
                        fontWeight: '500',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s ease-out',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.background = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.background = '#6366f1';
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Note'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNoteContent(notes[selectedDate]?.content || '');
                      }}
                      disabled={loading}
                      style={{
                        padding: '0.875rem 1.5rem',
                        background: 'white',
                        color: '#475569',
                        fontWeight: '500',
                        borderRadius: '0.75rem',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-out',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        flex: 1,
                        padding: '0.875rem 1.5rem',
                        background: '#6366f1',
                        color: 'white',
                        fontWeight: '500',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s ease-out',
                        fontFamily: 'Inter, -apple-system, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#6366f1';
                      }}
                    >
                      {notes[selectedDate] ? 'Edit Note' : 'Add Note'}
                    </button>
                    {notes[selectedDate] && (
                      <button
                        onClick={handleDeleteNote}
                        disabled={loading}
                        style={{
                          padding: '0.875rem 1.5rem',
                          background: '#ef4444',
                          color: 'white',
                          fontWeight: '500',
                          borderRadius: '0.75rem',
                          border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.5 : 1,
                          boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.2s ease-out',
                          fontFamily: 'Inter, -apple-system, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) e.currentTarget.style.background = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) e.currentTarget.style.background = '#ef4444';
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Calendar;
