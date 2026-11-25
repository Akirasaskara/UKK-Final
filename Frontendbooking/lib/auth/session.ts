import 'server-only';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const isCookieSecure =
  process.env.COOKIE_SECURE === 'true' ||
  (process.env.NODE_ENV === 'production' &&
    Boolean(process.env.APP_URL?.toLowerCase().startsWith('https://')));

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: 'high',
  });
}

export async function clearSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    priority: 'high',
  });
}
