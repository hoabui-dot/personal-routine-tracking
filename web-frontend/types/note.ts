export type NoteType = 'richtext' | 'mindmap';

export interface Note {
  id: number;
  title: string;
  date: string;
  content: string;
  type: NoteType;
  created_at: string;
  updated_at: string;
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
