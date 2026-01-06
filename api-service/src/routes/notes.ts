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
  title: note.title,
  date: note.date,
  content: note.content,
  type: note.type,
  created_at: note.created_at.toISOString(),
  updated_at: note.updated_at.toISOString(),
});

// GET /notes - Get all notes or filter by date range or type
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, date, type } = req.query;
    
    let queryText = 'SELECT * FROM notes';
    const queryParams: unknown[] = [];
    const conditions: string[] = [];

    if (date) {
      conditions.push(`date = $${conditions.length + 1}`);
      queryParams.push(date);
    } else if (startDate && endDate) {
      conditions.push(`date >= $${conditions.length + 1}`);
      queryParams.push(startDate);
      conditions.push(`date <= $${conditions.length + 1}`);
      queryParams.push(endDate);
    }

    if (type) {
      conditions.push(`type = $${conditions.length + 1}`);
      queryParams.push(type);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY updated_at DESC, date DESC';

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

    if (!noteData.title || !noteData.date || !noteData.content || !noteData.type) {
      res.status(400).json({
        success: false,
        error: 'Title, date, content, and type are required',
      });
      return;
    }

    // Validate type
    if (noteData.type !== 'richtext' && noteData.type !== 'mindmap') {
      res.status(400).json({
        success: false,
        error: 'Type must be either "richtext" or "mindmap"',
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
      'INSERT INTO notes (title, date, content, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [noteData.title.trim(), noteData.date, noteData.content.trim(), noteData.type]
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

    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updateData.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(updateData.title.trim());
    }

    if (updateData.content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(updateData.content.trim());
    }

    if (updateData.type !== undefined) {
      if (updateData.type !== 'richtext' && updateData.type !== 'mindmap') {
        res.status(400).json({
          success: false,
          error: 'Type must be either "richtext" or "mindmap"',
        });
        return;
      }
      updates.push(`type = $${paramCount++}`);
      values.push(updateData.type);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(noteId);

    const queryText = `UPDATE notes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await query(queryText, values);

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
