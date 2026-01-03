import { z } from 'zod';

// Client-side environment variables (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1, 'NEXT_PUBLIC_API_URL is required'),
});

// Server-side environment variables
const serverEnvSchema = z.object({
  INTERNAL_API_URL: z.string().min(1, 'INTERNAL_API_URL is required'),
  INTERNAL_SOCKET_URL: z.string().min(1, 'INTERNAL_SOCKET_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate client environment variables
function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

// Validate server environment variables
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    INTERNAL_SOCKET_URL: process.env.INTERNAL_SOCKET_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

// Export validated environment variables
export const clientEnv = validateClientEnv();

// Server env is only available on server-side
export const getServerEnv = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv can only be called on the server side');
  }
  return validateServerEnv();
};

// Type-safe environment variables
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
