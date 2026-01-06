import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { notesApi } from '../lib/api/notes';
import { Note, NoteType } from '../types/note';
import Header from '../components/Header';

// Import editors dynamically to avoid SSR issues
const TipTapEditor = dynamic(() => import('../components/TipTapEditor').then(mod => ({ default: mod.TipTapEditor })), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading editor...</div>
});

const MindMapEditor = dynamic(() => import('../components/MindMapEditor').then(mod => ({ default: mod.MindMapEditor })), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading mind map...</div>
});

export default function NotesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [richtextNotes, setRichtextNotes] = useState<Note[]>([]);
  const [mindmapNotes, setMindmapNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<NoteType>('richtext');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const [richtext, mindmap] = await Promise.all([
        notesApi.getNotes({ type: 'richtext' }),
        notesApi.getNotes({ type: 'mindmap' }),
      ]);
      setRichtextNotes(richtext);
      setMindmapNotes(mindmap);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      
      if (selectedNote) {
        // Update existing note
        const updated = await notesApi.updateNote(selectedNote.id, { title, content });
        
        // Update the appropriate list
        if (updated.type === 'richtext') {
          setRichtextNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        } else {
          setMindmapNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        }
        
        setSelectedNote(updated);
        toast.success('Note updated successfully');
      } else {
        // Create new note
        const created = await notesApi.createNote({ 
          title, 
          date: selectedDate, 
          content,
          type: activeTab 
        });
        
        // Add to the appropriate list
        if (created.type === 'richtext') {
          setRichtextNotes(prev => [created, ...prev]);
        } else {
          setMindmapNotes(prev => [created, ...prev]);
        }
        
        setSelectedNote(created);
        toast.success('Note created successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedDate(note.date);
    setActiveTab(note.type);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesApi.deleteNote(noteId);
      
      // Remove from both lists
      setRichtextNotes(prev => prev.filter(n => n.id !== noteId));
      setMindmapNotes(prev => prev.filter(n => n.id !== noteId));
      
      if (selectedNote?.id === noteId) {
        handleNewNote();
      }
      toast.success('Note deleted successfully');
    } catch (error: any) {
      console.error('Delete note error:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: theme.background,
        color: theme.text,
      }}>
        Loading...
      </div>
    );
  }

  const currentNotes = activeTab === 'richtext' ? richtextNotes : mindmapNotes;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: theme.background,
      color: theme.text,
    }}>
      {/* Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Sidebar with Tabs */}
        <div style={{
          width: '320px',
          borderRight: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          background: theme.surface,
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>📝 Notes</h1>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${theme.border}`,
            background: theme.background,
          }}>
            <button
              onClick={() => setActiveTab('richtext')}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === 'richtext' ? theme.surface : 'transparent',
                color: activeTab === 'richtext' ? theme.primary : theme.textSecondary,
                border: 'none',
                borderBottom: activeTab === 'richtext' ? `3px solid ${theme.primary}` : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'richtext' ? '600' : '500',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
              }}
            >
              📝 Rich Text ({richtextNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('mindmap')}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === 'mindmap' ? theme.surface : 'transparent',
                color: activeTab === 'mindmap' ? theme.primary : theme.textSecondary,
                border: 'none',
                borderBottom: activeTab === 'mindmap' ? `3px solid ${theme.primary}` : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'mindmap' ? '600' : '500',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
              }}
            >
              🧠 Mind Map ({mindmapNotes.length})
            </button>
          </div>

          {/* New Note Button */}
          <div style={{ padding: '16px' }}>
            <button
              onClick={handleNewNote}
              style={{
                width: '100%',
                padding: '12px',
                background: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9375rem',
              }}
            >
              + New {activeTab === 'richtext' ? 'Rich Text' : 'Mind Map'} Note
            </button>
          </div>

          {/* Notes List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '0 16px',
          }}>
            {currentNotes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: theme.textSecondary,
              }}>
                No {activeTab === 'richtext' ? 'rich text' : 'mind map'} notes yet
              </div>
            ) : (
              currentNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: selectedNote?.id === note.id ? theme.primaryHover : theme.background,
                    color: selectedNote?.id === note.id ? '#fff' : theme.text,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {note.title}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    opacity: 0.8,
                    marginBottom: '4px',
                  }}>
                    {new Date(note.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {note.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.surface,
            gap: '16px',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              />
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '10px 12px',
                  background: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                }}
              />
              
              {selectedNote && (
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  style={{
                    padding: '10px 16px',
                    background: theme.error,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '10px 24px',
                background: theme.success,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9375rem',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </button>
          </div>

          {/* Editor */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflow: 'hidden',
          }}>
            {!isMounted ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: theme.textSecondary,
              }}>
                Loading editor...
              </div>
            ) : activeTab === 'richtext' ? (
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your note..."
              />
            ) : (
              <MindMapEditor
                content={content}
                onChange={setContent}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
