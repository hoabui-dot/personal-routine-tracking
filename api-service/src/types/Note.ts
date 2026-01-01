export interface Note {
  id: number;
  date: string; // YYYY-MM-DD format
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteRequest {
  date: string;
  content: string;
}

export interface UpdateNoteRequest {
  content?: string;
}

export interface NoteResponse {
  id: number;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}
