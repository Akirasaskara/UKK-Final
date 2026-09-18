import 'server-only';

import { z } from 'zod';
import { upstreamAuthDataSchema, type AuthProfile } from '@/features/auth/schemas';
import { clearSessionToken, setSessionToken } from '@/lib/auth/session';
import { fetchUpstream, UpstreamUnavailableError } from '@/lib/server/upstream';

const successEnvelopeSchema = z.object({
  status: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.unknown(),
  timestamp: z.string(),
});

function noStoreHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  result.set('Cache-Control', 'no-store');
  result.set('Pragma', 'no-cache');
  return result;
}

function sanitizedGatewayError(error: unknown): Response {
  const timedOut =
    error instanceof UpstreamUnavailableError && error.timedOut;
  return Response.json(
    {
      status: false,
      statusCode: 503,
      message: timedOut
        ? 'Server membutuhkan waktu terlalu lama untuk merespons.'
        : 'Layanan autentikasi sedang tidak tersedia.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    },
    {
      status: 503,
      headers: noStoreHeaders(),
    },
  );
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function handleAuthMutation(
  request: Request,
  upstreamPath: string,
  bodySchema: z.ZodType,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        status: false,
        statusCode: 400,
        message: 'Body permintaan harus berupa JSON yang valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      {
        status: false,
        statusCode: 400,
        message: 'Data autentikasi tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetchUpstream(upstreamPath, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedBody.data),
    });
  } catch (error: unknown) {
    return sanitizedGatewayError(error);
  }

  const upstreamBody = await readJsonBody(upstreamResponse);
  if (!upstreamResponse.ok) {
    return Response.json(
      upstreamBody ?? {
        status: false,
        statusCode: upstreamResponse.status,
        message: 'Autentikasi tidak dapat diproses.',
        error: 'Upstream Error',
        timestamp: new Date().toISOString(),
      },
      {
        status: upstreamResponse.status,
        headers: noStoreHeaders(),
      },
    );
  }

  const envelopeResult = successEnvelopeSchema.safeParse(upstreamBody);
  if (!envelopeResult.success) {
    return Response.json(
      {
        status: false,
        statusCode: 502,
        message: 'Format respon autentikasi tidak sesuai kontrak.',
        error: 'Bad Gateway',
        timestamp: new Date().toISOString(),
      },
      { status: 502, headers: noStoreHeaders() },
    );
  }

  const authResult = upstreamAuthDataSchema.safeParse(
    envelopeResult.data.data,
  );
  if (!authResult.success) {
    return Response.json(
      {
        status: false,
        statusCode: 502,
        message: 'Data autentikasi tidak sesuai kontrak.',
        error: 'Bad Gateway',
        timestamp: new Date().toISOString(),
      },
      { status: 502, headers: noStoreHeaders() },
    );
  }

  const { access_token: accessToken, ...profile } = authResult.data;
  await setSessionToken(accessToken);

  return Response.json(
    {
      status: true,
      statusCode: envelopeResult.data.statusCode,
      message: envelopeResult.data.message,
      data: profile satisfies AuthProfile,
      timestamp: envelopeResult.data.timestamp,
    },
    {
      status: upstreamResponse.status,
      headers: noStoreHeaders(),
    },
  );
}

export async function unauthorizedSessionResponse(): Promise<Response> {
  await clearSessionToken();
  return Response.json(
    {
      status: false,
      statusCode: 401,
      message: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
    },
    {
      status: 401,
      headers: noStoreHeaders(),
    },
  );
}

export function noStoreResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: noStoreHeaders(),
  });
}

export function gatewayErrorResponse(error: unknown): Response {
  return sanitizedGatewayError(error);
}
