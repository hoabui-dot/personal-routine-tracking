import { Router, Request, Response } from 'express';
import { query } from '../db';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteResponse,
} from '../types/Note';

const router = Router();

// Convert database row to response format
const formatNoteResponse = (note: Note): NoteResponse => ({
  id: note.id,
  date: note.date,
  content: note.content,
  created_at: note.created_at.toISOString(),
  updated_at: note.updated_at.toISOString(),
});

// GET /notes - Get all notes or filter by date range
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, date } = req.query;
    
    let queryText = 'SELECT * FROM notes';
    const queryParams: unknown[] = [];

    if (date) {
      queryText += ' WHERE date = $1';
      queryParams.push(date);
    } else if (startDate && endDate) {
      queryText += ' WHERE date >= $1 AND date <= $2';
      queryParams.push(startDate, endDate);
    }

    queryText += ' ORDER BY date DESC';

    const result = await query(queryText, queryParams);
    const notes = result.rows.map(formatNoteResponse);

    res.json({
      success: true,
      data: notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes',
    });
  }
});

// GET /notes/:id - Get a specific note
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id || '');

    if (isNaN(noteId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid note ID',
      });
      return;
    }

    const result = await query('SELECT * FROM notes WHERE id = $1', [noteId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatNoteResponse(result.rows[0] as Note),
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note',
    });
  }
});

// POST /notes - Create a new note
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const noteData: CreateNoteRequest = req.body;

    if (!noteData.date || !noteData.content) {
      res.status(400).json({
        success: false,
        error: 'Date and content are required',
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(noteData.date)) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    const result = await query(
      'INSERT INTO notes (date, content) VALUES ($1, $2) RETURNING *',
      [noteData.date, noteData.content.trim()]
    );

    res.status(201).json({
      success: true,
      data: formatNoteResponse(result.rows[0] as Note),
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
    });
  }
});

// PUT /notes/:id - Update a note
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id || '');
    const updateData: UpdateNoteRequest = req.body;

    if (isNaN(noteId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid note ID',
      });
      return;
    }

    if (!updateData.content) {
      res.status(400).json({
        success: false,
        error: 'Content is required',
      });
      return;
    }

    const result = await query(
      'UPDATE notes SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [updateData.content.trim(), noteId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatNoteResponse(result.rows[0] as Note),
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
    });
  }
});

// DELETE /notes/:id - Delete a note
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id || '');

    if (isNaN(noteId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid note ID',
      });
      return;
    }

    const result = await query('DELETE FROM notes WHERE id = $1 RETURNING *', [noteId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatNoteResponse(result.rows[0] as Note),
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
    });
  }
});

export default router;
