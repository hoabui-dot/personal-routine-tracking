import { Note, CreateNoteRequest, UpdateNoteRequest, NoteType } from '../../types/note';
import { clientEnv } from '../env';

const API_URL = clientEnv.NEXT_PUBLIC_API_URL;

export const notesApi = {
  // Get all notes or filter by date range and/or type
  getNotes: async (params?: {
    startDate?: string;
    endDate?: string;
    date?: string;
    type?: NoteType;
  }): Promise<Note[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.type) queryParams.append('type', params.type);

    const url = `${API_URL}/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch notes');
    }

    return data.data;
  },

  // Get a specific note
  getNote: async (id: number): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes/${id}`, { credentials: 'include' });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch note');
    }

    return data.data;
  },

  // Create a new note
  createNote: async (noteData: CreateNoteRequest): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(noteData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create note');
    }

    return data.data;
  },

  // Update a note
  updateNote: async (id: number, noteData: UpdateNoteRequest): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(noteData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update note');
    }

    return data.data;
  },

  // Delete a note
  deleteNote: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete note');
    }
  },
};
