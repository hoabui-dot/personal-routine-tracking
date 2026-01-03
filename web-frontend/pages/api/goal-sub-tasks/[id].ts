import type { NextApiRequest, NextApiResponse} from 'next';
import { getInternalApiUrl } from '../../../lib/apiConfig';
import { proxyRequest } from '../../../lib/proxyHelper';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, ...queryParams } = req.query;
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
  const url = `${INTERNAL_API_URL}/goal-sub-tasks/${id}${queryString ? `?${queryString}` : ''}`;
  await proxyRequest(req, res, url, '[GoalSubTasks API]');
}
