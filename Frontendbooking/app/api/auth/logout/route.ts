import type { NextRequest } from 'next/server';
import { noStoreResponse } from '@/lib/auth/bff';
import { clearSessionToken } from '@/lib/auth/session';
import {
  forbiddenOriginResponse,
  isSameOriginRequest,
} from '@/lib/auth/origin';

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();
  await clearSessionToken();
  return noStoreResponse({
    status: true,
    statusCode: 200,
    message: 'Sesi berhasil dihapus.',
    data: null,
    timestamp: new Date().toISOString(),
  });
}
