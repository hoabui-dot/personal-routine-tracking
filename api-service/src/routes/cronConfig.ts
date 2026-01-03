import { Router, Request, Response } from 'express';
import { query } from '../db';
import { cronJobs } from '../services/cronService';

const router = Router();

// GET /cron-config - Get all cron configurations
router.get('/', async (_req: Request, res: Response) => {
  try {
    const configs = await cronJobs.getAllCronConfigs();
    
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching cron configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cron configurations',
    });
  }
});

// GET /cron-config/:jobName - Get specific cron configuration
router.get('/:jobName', async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params;
    
    if (!jobName) {
      res.status(400).json({
        success: false,
        error: 'Job name is required',
      });
      return;
    }
    
    const config = await cronJobs.getCronConfig(jobName);
    
    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Cron configuration not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching cron config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cron configuration',
    });
  }
});

// PUT /cron-config/:jobName - Update cron configuration
router.put('/:jobName', async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params;
    const { cron_expression, enabled, description } = req.body;
    
    // Validate cron expression if provided
    if (cron_expression !== undefined) {
      const cron = require('node-cron');
      if (!cron.validate(cron_expression)) {
        res.status(400).json({
          success: false,
          error: 'Invalid cron expression',
        });
        return;
      }
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (cron_expression !== undefined) {
      updates.push(`cron_expression = $${paramIndex}`);
      values.push(cron_expression);
      paramIndex++;
    }
    
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex}`);
      values.push(enabled);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
      return;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(jobName);
    
    const result = await query(
      `UPDATE cron_config SET ${updates.join(', ')} WHERE job_name = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Cron configuration not found',
      });
      return;
    }
    
    // Reload cron jobs to apply changes
    await cronJobs.reloadCronJobs();
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cron configuration updated and jobs reloaded',
    });
  } catch (error) {
    console.error('Error updating cron config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cron configuration',
    });
  }
});

// POST /cron-config/reload - Reload all cron jobs
router.post('/reload', async (_req: Request, res: Response) => {
  try {
    await cronJobs.reloadCronJobs();
    
    res.json({
      success: true,
      message: 'Cron jobs reloaded successfully',
    });
  } catch (error) {
    console.error('Error reloading cron jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reload cron jobs',
    });
  }
});

export default router;
