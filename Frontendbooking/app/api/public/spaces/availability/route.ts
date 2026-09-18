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
        : 'Layanan pengecekan ketersediaan sedang tidak tersedia.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    503,
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const idSpace = searchParams.get('id_space');
  const tanggal = searchParams.get('tanggal');
  const jamMulai = searchParams.get('jam_mulai');
  const durasiJam = searchParams.get('durasi_jam');

  if (!idSpace || !tanggal || !jamMulai || !durasiJam) {
    return jsonNoStore(
      {
        status: false,
        statusCode: 400,
        message: 'Parameter id_space, tanggal, jam_mulai, dan durasi_jam wajib disertakan.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const upstreamParams = new URLSearchParams({
    id_space: idSpace,
    tanggal,
    jam_mulai: jamMulai,
    durasi_jam: durasiJam,
  });

  try {
    const upstreamResponse = await fetchUpstream(
      `/api/spaces/availability?${upstreamParams.toString()}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    );

    const body = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      return jsonNoStore(
        body ?? {
          status: false,
          statusCode: upstreamResponse.status,
          message: 'Pengecekan ketersediaan tidak dapat diproses.',
          error: 'Bad Request',
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
