import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { reportSummaryResultSchema } from '@/features/admin/reports/schemas';
import {
  gatewayErrorResponse,
  noStoreResponse,
  unauthorizedSessionResponse,
} from '@/lib/auth/bff';
import { getSessionToken } from '@/lib/auth/session';
import { fetchUpstream } from '@/lib/server/upstream';
import { buildMonthlySummaryEnvelope, monthFromRange } from '@/lib/server/report-compat';

const querySchema = z.object({
  granularity: z.enum(['day', 'week', 'month']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const envelopeSchema = z.object({
  status: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: reportSummaryResultSchema,
  timestamp: z.string(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const searchParams = request.nextUrl.searchParams;
  const parsedQuery = querySchema.safeParse({
    granularity: searchParams.get('granularity'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  if (!parsedQuery.success) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Parameter filter laporan tidak valid.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const qs = new URLSearchParams({
    granularity: parsedQuery.data.granularity,
    from: parsedQuery.data.from,
    to: parsedQuery.data.to,
  }).toString();

  try {
    const upstreamResponse = await fetchUpstream(`/api/admin/reports/summary?${qs}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let body = await upstreamResponse.json().catch(() => null);
    if (upstreamResponse.status === 401) return unauthorizedSessionResponse();

    if (!upstreamResponse.ok && upstreamResponse.status === 404) {
      const month = monthFromRange(parsedQuery.data.from, parsedQuery.data.to);
      if (!month || parsedQuery.data.granularity !== 'month') {
        return noStoreResponse(
          {
            status: false,
            statusCode: 501,
            message: 'Backend saat ini hanya mendukung fallback laporan bulanan satu bulan kalender.',
            error: 'Not Implemented',
            timestamp: new Date().toISOString(),
          },
          501,
        );
      }

      const monthlyParams = new URLSearchParams({
        month: String(month.month),
        year: String(month.year),
      });
      const monthlyResponse = await fetchUpstream(
        `/api/admin/reports/monthly?${monthlyParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const monthlyBody = await monthlyResponse.json().catch(() => null);
      if (monthlyResponse.status === 401) return unauthorizedSessionResponse();
      if (!monthlyResponse.ok) return noStoreResponse(monthlyBody, monthlyResponse.status);

      body = buildMonthlySummaryEnvelope(
        monthlyBody,
        parsedQuery.data.from,
        parsedQuery.data.to,
      );
      if (!body) {
        return noStoreResponse(
          {
            status: false,
            statusCode: 502,
            message: 'Format laporan bulanan backend tidak sesuai kontrak.',
            error: 'Bad Gateway',
            timestamp: new Date().toISOString(),
          },
          502,
        );
      }
    } else if (!upstreamResponse.ok) {
      return noStoreResponse(body, upstreamResponse.status);
    }

    const parsedEnvelope = envelopeSchema.safeParse(body);
    if (!parsedEnvelope.success) {
      return noStoreResponse(
        {
          status: false,
          statusCode: 502,
          message: 'Format respon laporan tidak sesuai kontrak.',
          error: 'Bad Gateway',
          timestamp: new Date().toISOString(),
        },
        502,
      );
    }

    return noStoreResponse(parsedEnvelope.data, 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
