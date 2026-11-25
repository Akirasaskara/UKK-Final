import type { NextRequest } from 'next/server';

function buildTrustedOrigins(): Set<string> {
  const trusted = new Set<string>();

  // Canonical app URL from environment (recommended for production)
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try { trusted.add(new URL(appUrl.trim()).origin); } catch { /* invalid URL, skip */ }
  }

  // Local development origins
  trusted.add('http://localhost:3000');
  trusted.add('http://localhost:3001');
  trusted.add('http://localhost:3100');
  trusted.add('http://127.0.0.1:3000');
  trusted.add('http://127.0.0.1:3100');

  return trusted;
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const trusted = buildTrustedOrigins();
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';

  const matchesHost = (candidateUrl: string) => {
    if (!host) return false;
    return (
      candidateUrl === `${proto}://${host}` ||
      candidateUrl === `http://${host}` ||
      candidateUrl === `https://${host}`
    );
  };

  if (origin) {
    try {
      const parsedOrigin = new URL(origin).origin;
      return trusted.has(parsedOrigin) || matchesHost(parsedOrigin);
    } catch {
      return false;
    }
  }

  // No Origin header: fallback to sec-fetch-site + referer
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }

  const referer = request.headers.get('referer');
  if (!referer) {
    return fetchSite === 'same-origin';
  }

  try {
    const parsedReferer = new URL(referer).origin;
    return trusted.has(parsedReferer) || matchesHost(parsedReferer);
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
