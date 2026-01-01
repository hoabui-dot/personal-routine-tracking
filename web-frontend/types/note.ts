export interface Note {
  id: number;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  date: string;
  content: string;
}

export interface UpdateNoteRequest {
  content: string;
}
