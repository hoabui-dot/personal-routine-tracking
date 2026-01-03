import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /user-theme/:userId - Get user's theme preference
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }
    
    const result = await query(
      'SELECT id, theme FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        userId: result.rows[0].id,
        theme: result.rows[0].theme || 'capybara-light',
      },
    });
  } catch (error) {
    console.error('Error fetching user theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user theme',
    });
  }
});

// PUT /user-theme/:userId - Update user's theme preference
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { theme } = req.body;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }
    
    if (!theme) {
      res.status(400).json({
        success: false,
        error: 'theme is required',
      });
      return;
    }
    
    // Validate theme value
    const validThemes = ['capybara-light', 'capybara-dark', 'christmas'];
    if (!validThemes.includes(theme)) {
      res.status(400).json({
        success: false,
        error: `Invalid theme. Must be one of: ${validThemes.join(', ')}`,
      });
      return;
    }
    
    const result = await query(
      'UPDATE users SET theme = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, theme',
      [theme, userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        userId: result.rows[0].id,
        theme: result.rows[0].theme,
      },
      message: 'Theme updated successfully',
    });
  } catch (error) {
    console.error('Error updating user theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user theme',
    });
  }
});

export default router;
