import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { buildDashboardEnvelope } from '@/lib/server/dashboard-compat';

function jakartaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function upstreamGet(path: string, token: string): Promise<Response> {
  return fetchUpstream(path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function GET(): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  try {
    const upstreamResponse = await upstreamGet('/api/admin/dashboard', token);
    const body = await upstreamResponse.json().catch(() => null);
    if (upstreamResponse.status === 401) return unauthorizedSessionResponse();
    if (upstreamResponse.ok) return noStoreResponse(body, 200);
    if (upstreamResponse.status !== 404) {
      return noStoreResponse(body, upstreamResponse.status);
    }

    const [reservationsResponse, spacesResponse, membersResponse] = await Promise.all([
      upstreamGet('/api/admin/reservasi', token),
      upstreamGet('/api/admin/spaces', token),
      upstreamGet('/api/admin/members', token),
    ]);

    if ([reservationsResponse, spacesResponse, membersResponse].some((res) => res.status === 401)) {
      return unauthorizedSessionResponse();
    }

    const [reservationsBody, spacesBody, membersBody] = await Promise.all([
      reservationsResponse.json().catch(() => null),
      spacesResponse.json().catch(() => null),
      membersResponse.json().catch(() => null),
    ]);

    if (!reservationsResponse.ok || !spacesResponse.ok || !membersResponse.ok) {
      return noStoreResponse(
        {
          status: false,
          statusCode: 502,
          message: 'Data sumber dashboard tidak dapat dimuat.',
          error: 'Bad Gateway',
          timestamp: new Date().toISOString(),
        },
        502,
      );
    }

    const dashboard = buildDashboardEnvelope(
      reservationsBody,
      spacesBody,
      membersBody,
      jakartaToday(),
    );
    if (!dashboard) {
      return noStoreResponse(
        {
          status: false,
          statusCode: 502,
          message: 'Format data sumber dashboard tidak sesuai kontrak.',
          error: 'Bad Gateway',
          timestamp: new Date().toISOString(),
        },
        502,
      );
    }

    return noStoreResponse(dashboard, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
