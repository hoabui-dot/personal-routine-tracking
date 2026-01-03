import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getInternalApiUrl } from '../../lib/apiConfig';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Path is required' });
  }

  const url = `${INTERNAL_API_URL}/${path}`;
  
  try {
    console.log('[API Proxy] Request:', {
      method: req.method,
      url,
      headers: {
        authorization: req.headers.authorization,
        'content-type': req.headers['content-type'],
      },
    });

    const config: any = {
      method: req.method,
      url,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      params: req.query,
      validateStatus: () => true, // Don't throw on any status
    };

    // Only include body for methods that support it
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);

    console.log('[API Proxy] Response:', {
      status: response.status,
      url,
    });

    // Forward the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[API Proxy] Error:', {
      url,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
