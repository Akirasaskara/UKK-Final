import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';

export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const upstreamParams = new URLSearchParams();
  if (month && /^[1-9]|1[0-2]$/.test(month)) {
    upstreamParams.set('month', month);
  }
  if (year && /^20\d{2}$/.test(year)) {
    upstreamParams.set('year', year);
  }

  const qs = upstreamParams.toString();
  const path = qs ? `/api/admin/reports/income?${qs}` : '/api/admin/reports/income';

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
