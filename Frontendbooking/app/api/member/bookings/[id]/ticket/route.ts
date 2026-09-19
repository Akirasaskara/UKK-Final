import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id)) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'ID reservasi tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const parsedId = Number.parseInt(id, 10);

  try {
    const upstreamResponse = await fetchUpstream(`/api/reservasi/${parsedId}/e-ticket`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401) return unauthorizedSessionResponse();
      return noStoreResponse(body, upstreamResponse.status);
    }

    return noStoreResponse(body, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
