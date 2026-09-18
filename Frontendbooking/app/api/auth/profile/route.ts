import { z } from 'zod';
import { authProfileSchema } from '@/features/auth/schemas';
import {
  gatewayErrorResponse,
  noStoreResponse,
  unauthorizedSessionResponse,
} from '@/lib/auth/bff';
import { getSessionToken } from '@/lib/auth/session';
import { fetchUpstream } from '@/lib/server/upstream';

const envelopeSchema = z.object({
  status: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: authProfileSchema,
  timestamp: z.string(),
});

export async function GET(): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetchUpstream('/api/auth/profile', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }

  let body: unknown;
  try {
    body = await upstreamResponse.json();
  } catch {
    return noStoreResponse(
      {
        status: false,
        statusCode: 502,
        message: 'Format respon profil tidak sesuai kontrak.',
        error: 'Bad Gateway',
        timestamp: new Date().toISOString(),
      },
      502,
    );
  }

  if (upstreamResponse.status === 401) {
    return unauthorizedSessionResponse();
  }

  if (!upstreamResponse.ok) {
    return noStoreResponse(body, upstreamResponse.status);
  }

  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 502,
        message: 'Data profil tidak sesuai kontrak.',
        error: 'Bad Gateway',
        timestamp: new Date().toISOString(),
      },
      502,
    );
  }

  return noStoreResponse(parsed.data, upstreamResponse.status);
}
