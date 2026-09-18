import 'server-only';

import { env } from '@/config/env';

const DEFAULT_TIMEOUT_MS = 15000;

export class UpstreamUnavailableError extends Error {
  constructor(public readonly timedOut: boolean) {
    super(timedOut ? 'Upstream request timed out' : 'Upstream request failed');
    this.name = 'UpstreamUnavailableError';
  }
}

function buildUpstreamUrl(path: string): string {
  const baseUrl = env.BACKEND_API_URL.endsWith('/')
    ? env.BACKEND_API_URL
    : `${env.BACKEND_API_URL}/`;
  return new URL(path.replace(/^\//, ''), baseUrl).toString();
}

export async function fetchUpstream(
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(buildUpstreamUrl(path), {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error: unknown) {
    throw new UpstreamUnavailableError(
      error instanceof Error && error.name === 'AbortError',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
