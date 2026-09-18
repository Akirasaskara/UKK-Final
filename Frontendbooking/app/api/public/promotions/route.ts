import { fetchUpstream, UpstreamUnavailableError } from '@/lib/server/upstream';

function jsonResponse(body: unknown, status = 200, maxAge = 120): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=30`,
    },
  });
}

function handleGatewayError(error: unknown): Response {
  const isTimeout =
    error instanceof UpstreamUnavailableError && error.timedOut;
  return Response.json(
    {
      status: false,
      statusCode: 503,
      message: isTimeout
        ? 'Server membutuhkan waktu terlalu lama untuk merespons.'
        : 'Layanan promosi sedang tidak tersedia.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export async function GET(): Promise<Response> {
  try {
    const upstreamResponse = await fetchUpstream('/api/diskon/active', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const body = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      return Response.json(
        body ?? {
          status: false,
          statusCode: upstreamResponse.status,
          message: 'Gagal mengambil daftar promosi aktif.',
          error: 'Upstream Error',
          timestamp: new Date().toISOString(),
        },
        { status: upstreamResponse.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return jsonResponse(body, 200);
  } catch (error: unknown) {
    return handleGatewayError(error);
  }
}
