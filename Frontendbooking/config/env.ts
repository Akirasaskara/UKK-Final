import { z } from 'zod';

const envSchema = z.object({
  BACKEND_API_URL: z
    .string()
    .url('BACKEND_API_URL harus berupa URL yang valid.')
    .refine(
      (url) => {
        const isLocal =
          url.includes('localhost') ||
          url.includes('127.0.0.1') ||
          url.includes('0.0.0.0');
        if (isLocal) return true;
        if (process.env.NODE_ENV === 'production') {
          return url.startsWith('https://');
        }
        return true;
      },
      {
        message:
          'BACKEND_API_URL pada mode production untuk remote host wajib menggunakan protokol HTTPS.',
      },
    ),
});

function getEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawUrl = process.env.BACKEND_API_URL;

  if (isProduction && !rawUrl) {
    throw new Error('BACKEND_API_URL environment variable wajib diisi pada mode production.');
  }

  const backendUrl = rawUrl || 'http://localhost:3000';

  return envSchema.parse({
    BACKEND_API_URL: backendUrl,
  });
}

export const env = getEnv();
