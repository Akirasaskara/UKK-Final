import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if ((pathname === '/member' || pathname.startsWith('/member/')) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register/:path*', '/member/:path*', '/admin/:path*'],
};
