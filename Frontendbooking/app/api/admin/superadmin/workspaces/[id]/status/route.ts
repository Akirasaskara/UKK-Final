import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { isSameOriginRequest, forbiddenOriginResponse } from '@/lib/auth/origin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return noStoreResponse(
      { status: false, statusCode: 400, message: 'ID workspace tidak valid' },
      400,
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !['approved', 'rejected'].includes(body.status)) {
    return noStoreResponse(
      { status: false, statusCode: 400, message: 'Status harus bernilai approved atau rejected' },
      400,
    );
  }

  try {
    const upstreamResponse = await fetchUpstream(`/api/admin/superadmin/workspaces/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401) return unauthorizedSessionResponse();
      return noStoreResponse(responseBody, upstreamResponse.status);
    }

    return noStoreResponse(responseBody, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
