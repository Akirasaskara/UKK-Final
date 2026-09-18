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
        : 'Layanan katalog space sedang tidak tersedia.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    503,
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const tipe = searchParams.get('tipe');
  const search = searchParams.get('search');

  const upstreamParams = new URLSearchParams();
  if (tipe && ['desk', 'meeting_room', 'private_office'].includes(tipe)) {
    upstreamParams.set('tipe', tipe);
  }
  if (search && search.trim().length > 0) {
    upstreamParams.set('search', search.trim());
  }

  const queryString = upstreamParams.toString();
  const path = queryString ? `/api/spaces?${queryString}` : '/api/spaces';

  try {
    const upstreamResponse = await fetchUpstream(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const body = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      return jsonNoStore(
        body ?? {
          status: false,
          statusCode: upstreamResponse.status,
          message: 'Gagal mengambil daftar space.',
          error: 'Upstream Error',
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
