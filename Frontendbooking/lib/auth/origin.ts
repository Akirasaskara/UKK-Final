import type { NextRequest } from 'next/server';

export function isSameOriginRequest(request: NextRequest): boolean {
  const requestOrigin = request.nextUrl.origin;
  const origin = request.headers.get('origin');

  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }
  const referer = request.headers.get('referer');
  if (!referer) {
    return fetchSite === 'same-origin';
  }

  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
}

export function forbiddenOriginResponse(): Response {
  return Response.json(
    {
      status: false,
      statusCode: 403,
      message: 'Permintaan ditolak karena origin tidak valid.',
      error: 'Forbidden',
      timestamp: new Date().toISOString(),
    },
    {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
