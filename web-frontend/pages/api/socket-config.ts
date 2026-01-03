import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return empty string to use same origin (window.location.origin)
    // This allows the browser to connect to the same domain it's on
    res.status(200).json({
      success: true,
      socketUrl: '', // Empty string means use same origin
    });
  } catch (error) {
    console.error('[Socket Config API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get socket configuration',
    });
  }
}
