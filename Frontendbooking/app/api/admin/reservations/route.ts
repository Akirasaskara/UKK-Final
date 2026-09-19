import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';

export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const tanggal = searchParams.get('tanggal');
  const idSpace = searchParams.get('id_space');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const upstreamParams = new URLSearchParams();
  if (status) upstreamParams.set('status', status);
  if (tanggal) upstreamParams.set('tanggal', tanggal);
  if (idSpace) upstreamParams.set('id_space', idSpace);
  if (month) upstreamParams.set('month', month);
  if (year) upstreamParams.set('year', year);

  const qs = upstreamParams.toString();
  const path = qs ? `/api/admin/reservasi?${qs}` : '/api/admin/reservasi';

  try {
    const upstreamResponse = await fetchUpstream(path, {
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
