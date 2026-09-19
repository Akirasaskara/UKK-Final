import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { isSameOriginRequest, forbiddenOriginResponse } from '@/lib/auth/origin';

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
        message: 'ID member tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const parsedId = Number.parseInt(id, 10);

  try {
    const upstreamResponse = await fetchUpstream(`/api/admin/members/${parsedId}`, {
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id)) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'ID member tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const parsedId = Number.parseInt(id, 10);

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
    const upstreamResponse = await fetchUpstream(`/api/admin/members/${parsedId}`, {
      method: 'PUT',
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

    return noStoreResponse(resBody, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
