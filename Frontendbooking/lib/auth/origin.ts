import type { NextRequest } from 'next/server';

export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return false;

  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  const requestProtocol = forwardedProtocol
    ? forwardedProtocol.split(',')[0]?.trim()
    : new URL(request.url).protocol.replace(':', '');
  const requestOrigin = `${requestProtocol}://${host}`;
  const origin = request.headers.get('origin');

  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  const referer = request.headers.get('referer');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }
  if (!referer) return false;

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
