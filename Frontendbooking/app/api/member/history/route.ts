import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { memberHistorySchema } from '@/features/bookings/schemas';
import {
  gatewayErrorResponse,
  noStoreResponse,
  unauthorizedSessionResponse,
} from '@/lib/auth/bff';
import { getSessionToken } from '@/lib/auth/session';
import { fetchUpstream } from '@/lib/server/upstream';

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const envelopeSchema = z
  .object({
    status: z.union([z.literal(true), z.boolean()]).transform(() => true as const),
    statusCode: z.coerce.number(),
    message: z.string().optional().default('OK'),
    data: memberHistorySchema,
    timestamp: z.string().optional().default(() => new Date().toISOString()),
  })
  .passthrough();

function invalidQueryResponse(): Response {
  return noStoreResponse(
    {
      status: false,
      statusCode: 400,
      message: 'Periode riwayat tidak valid.',
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
    },
    400,
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const parsedQuery = querySchema.safeParse({
    month: request.nextUrl.searchParams.get('month'),
    year: request.nextUrl.searchParams.get('year'),
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  });
  if (!parsedQuery.success) return invalidQueryResponse();

  const params = new URLSearchParams({
    month: String(parsedQuery.data.month),
    year: String(parsedQuery.data.year),
    page: String(parsedQuery.data.page),
    limit: String(parsedQuery.data.limit),
  });

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetchUpstream(`/api/reservasi/my/history?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }

  const body = await upstreamResponse.json().catch(() => null);
  if (upstreamResponse.status === 401) return unauthorizedSessionResponse();
  if (!upstreamResponse.ok) return noStoreResponse(body, upstreamResponse.status);

  const parsedBody = envelopeSchema.safeParse(body);
  if (!parsedBody.success) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 502,
        message: 'Data riwayat tidak sesuai kontrak.',
        error: 'Bad Gateway',
        timestamp: new Date().toISOString(),
      },
      502,
    );
  }

  const upstreamPage = Number(upstreamResponse.headers.get('X-Page'));
  const upstreamLimit = Number(upstreamResponse.headers.get('X-Per-Page'));
  const upstreamTotal = Number(upstreamResponse.headers.get('X-Total-Count'));
  const page = Number.isInteger(upstreamPage) && upstreamPage > 0
    ? upstreamPage
    : parsedQuery.data.page;
  const limit = Number.isInteger(upstreamLimit) && upstreamLimit > 0 && upstreamLimit <= 100
    ? upstreamLimit
    : parsedQuery.data.limit;
  const total = Number.isInteger(upstreamTotal) && upstreamTotal >= 0
    ? upstreamTotal
    : parsedBody.data.data.total_reservasi;
  const response = noStoreResponse(
    {
      ...parsedBody.data,
      data: {
        ...parsedBody.data.data,
        page,
        limit,
        total_reservasi: total,
      },
    },
    200,
  );
  response.headers.set('X-Page', String(page));
  response.headers.set('X-Per-Page', String(limit));
  response.headers.set('X-Total-Count', String(total));
  return response;
}
