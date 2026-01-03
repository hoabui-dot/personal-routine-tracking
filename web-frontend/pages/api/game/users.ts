import type { NextApiRequest, NextApiResponse } from 'next';
import { getInternalApiUrl } from '../../../lib/apiConfig';
import { proxyRequest } from '../../../lib/proxyHelper';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = `${INTERNAL_API_URL}/users`;
  await proxyRequest(req, res, url, '[Game/Users API]');
}
