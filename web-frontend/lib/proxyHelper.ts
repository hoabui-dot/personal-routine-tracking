import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * Helper function to proxy requests from Next.js API routes to the backend
 */
export async function proxyRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  targetUrl: string,
  logPrefix: string = '[API Proxy]'
) {
  try {
    console.log(`${logPrefix} Request:`, {
      method: req.method,
      url: targetUrl,
      hasAuth: !!req.headers.authorization,
      hasCookies: !!req.headers.cookie,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const config: AxiosRequestConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        ...(req.headers.cookie && { Cookie: req.headers.cookie }), // Forward cookies
      },
      validateStatus: () => true, // Don't throw on any status code
      withCredentials: true, // Important for cookies
    };

    // Only include body for methods that support it
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);

    console.log(`${logPrefix} Response:`, {
      status: response.status,
      url: targetUrl,
      success: response.data?.success,
      hasCookies: !!response.headers['set-cookie'],
    });

    // Forward Set-Cookie headers from backend to client
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`${logPrefix} Error:`, {
      url: targetUrl,
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
