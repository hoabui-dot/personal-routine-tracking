import type { NextApiRequest, NextApiResponse } from 'next';
import { getInternalApiUrl } from '../../../lib/apiConfig';
import { proxyRequest } from '../../../lib/proxyHelper';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;
  const url = `${INTERNAL_API_URL}/user-theme/${userId}`;
  await proxyRequest(req, res, url, '[UserTheme API]');
}
