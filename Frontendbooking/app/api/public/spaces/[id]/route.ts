import type { NextRequest } from 'next/server';
import { fetchUpstream, UpstreamUnavailableError } from '@/lib/server/upstream';

function jsonNoStore(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

function handleGatewayError(error: unknown): Response {
  const isTimeout =
    error instanceof UpstreamUnavailableError && error.timedOut;
  return jsonNoStore(
    {
      status: false,
      statusCode: 503,
      message: isTimeout
        ? 'Server membutuhkan waktu terlalu lama untuk merespons.'
        : 'Layanan detail space sedang tidak tersedia.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    503,
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return jsonNoStore(
      {
        status: false,
        statusCode: 400,
        message: 'ID space tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const parsedId = Number.parseInt(id, 10);

  try {
    const upstreamResponse = await fetchUpstream(`/api/spaces/${parsedId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const body = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      return jsonNoStore(
        body ?? {
          status: false,
          statusCode: upstreamResponse.status,
          message: 'Space tidak ditemukan.',
          error: 'Not Found',
          timestamp: new Date().toISOString(),
        },
        upstreamResponse.status,
      );
    }

    return jsonNoStore(body, 200);
  } catch (error: unknown) {
    return handleGatewayError(error);
  }
}
