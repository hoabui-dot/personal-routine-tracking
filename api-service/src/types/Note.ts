export type NoteType = 'richtext' | 'mindmap';

export interface Note {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD format
  content: string;
  type: NoteType;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteRequest {
  title: string;
  date: string;
  content: string;
  type: NoteType;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  type?: NoteType;
}

export interface NoteResponse {
  id: number;
  title: string;
  date: string;
  content: string;
  type: NoteType;
  created_at: string;
  updated_at: string;
}
