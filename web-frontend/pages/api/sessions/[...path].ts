import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getInternalApiUrl } from '../../../lib/apiConfig';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path, ...queryParams } = req.query;
  const pathArray = Array.isArray(path) ? path : [path];
  const endpoint = pathArray.filter(Boolean).join('/');
  
  const url = endpoint 
    ? `${INTERNAL_API_URL}/sessions/${endpoint}`
    : `${INTERNAL_API_URL}/sessions`;
  
  try {
    console.log('[Sessions API] Request:', {
      method: req.method,
      url,
      hasAuth: !!req.headers.authorization,
    });

    const config: any = {
      method: req.method,
      url,
      params: queryParams,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      validateStatus: () => true,
    };

    // Only include body for methods that support it
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);

    console.log('[Sessions API] Response:', {
      status: response.status,
      url,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Sessions API] Error:', {
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
