import type { NextApiRequest, NextApiResponse } from 'next';
import { getInternalApiUrl } from '../../../lib/apiConfig';
import { proxyRequest } from '../../../lib/proxyHelper';

const INTERNAL_API_URL = getInternalApiUrl();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { year, ...queryParams } = req.query;
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
  const yearParam = year ? `year=${year}` : '';
  const fullQuery = [yearParam, queryString].filter(Boolean).join('&');
  const url = `${INTERNAL_API_URL}/goals${fullQuery ? `?${fullQuery}` : ''}`;
  await proxyRequest(req, res, url, '[Goals API]');
}
