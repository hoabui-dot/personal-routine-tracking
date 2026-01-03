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
    ? `${INTERNAL_API_URL}/goals/${endpoint}`
    : `${INTERNAL_API_URL}/goals`;
  
  try {
    console.log('[Goals [...path]] Request:', {
      method: req.method,
      url,
      path: pathArray,
      endpoint,
      hasAuth: !!req.headers.authorization,
      params: queryParams,
      body: req.body,
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
    if (req.method && !['GET', 'HEAD', 'DELETE'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);

    console.log('[Goals [...path]] Response:', {
      status: response.status,
      url,
      success: response.data?.success,
      data: response.data,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Goals [...path]] Error:', {
      url,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
