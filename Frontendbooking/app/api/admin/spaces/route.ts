import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { isSameOriginRequest, forbiddenOriginResponse } from '@/lib/auth/origin';
import { normalizePaginatedEnvelope, normalizeSpaceItem } from '@/lib/server/admin-compat';

export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const searchParams = request.nextUrl.searchParams;
  const tipe = searchParams.get('tipe');
  const search = searchParams.get('search');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const upstreamParams = new URLSearchParams();
  if (tipe && ['desk', 'meeting_room', 'private_office'].includes(tipe)) {
    upstreamParams.set('tipe', tipe);
  }
  if (search && search.trim().length > 0) {
    upstreamParams.set('search', search.trim());
  }
  if (page && /^[1-9]\d*$/.test(page)) {
    upstreamParams.set('page', page);
  }
  if (limit && /^[1-9]\d*$/.test(limit)) {
    upstreamParams.set('limit', limit);
  }

  const qs = upstreamParams.toString();
  const path = qs ? `/api/admin/spaces?${qs}` : '/api/admin/spaces';

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

    const requestedPage = page ? Number(page) : 1;
    const requestedLimit = limit ? Math.min(Number(limit), 100) : 20;
    const normalized = normalizePaginatedEnvelope(
      body,
      requestedPage,
      requestedLimit,
      normalizeSpaceItem,
    );
    if (!normalized) {
      return noStoreResponse(
        {
          status: false,
          statusCode: 502,
          message: 'Format respon inventaris tidak sesuai kontrak.',
          error: 'Bad Gateway',
          timestamp: new Date().toISOString(),
        },
        502,
      );
    }

    return noStoreResponse(normalized, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Body permintaan harus berupa JSON yang valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  try {
    const upstreamResponse = await fetchUpstream('/api/admin/spaces', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const resBody = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401) return unauthorizedSessionResponse();
      return noStoreResponse(resBody, upstreamResponse.status);
    }

    return noStoreResponse(resBody, 201);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
