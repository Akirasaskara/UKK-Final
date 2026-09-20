import type { NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { isSameOriginRequest, forbiddenOriginResponse } from '@/lib/auth/origin';

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  let incomingFormData: FormData;
  try {
    incomingFormData = await request.formData();
  } catch {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Format data unggahan harus berupa multipart/form-data yang valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const file = incomingFormData.get('file');
  if (!file || !(file instanceof Blob)) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'File gambar wajib diunggah dalam field file.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Format berkas tidak didukung. Hanya .jpg, .jpeg, .png, dan .webp yang diizinkan.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Ukuran berkas melebihi batas maksimal 5MB.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const outgoingFormData = new FormData();
  outgoingFormData.append('file', file);

  try {
    const upstreamResponse = await fetchUpstream('/api/upload/spaces', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: outgoingFormData,
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
