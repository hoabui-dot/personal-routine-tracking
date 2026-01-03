import { getServerEnv } from './env';

/**
 * Get the internal API URL for server-side API calls
 * This should only be called from API routes (server-side)
 */
export function getInternalApiUrl(): string {
  const serverEnv = getServerEnv();
  return serverEnv.INTERNAL_API_URL;
}
