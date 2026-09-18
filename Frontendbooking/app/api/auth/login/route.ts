import type { NextRequest } from 'next/server';
import { loginSchema } from '@/features/auth/schemas';
import { handleAuthMutation } from '@/lib/auth/bff';
import {
  forbiddenOriginResponse,
  isSameOriginRequest,
} from '@/lib/auth/origin';

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();
  return handleAuthMutation(request, '/api/auth/login', loginSchema);
}
