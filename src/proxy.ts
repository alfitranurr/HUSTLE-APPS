import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session')?.value;
  const jwtSecret = process.env.JWT_SECRET || 'hustle-apps-fallback-secret-2026';

  // 1. Bypass check for Next.js internals, public static assets, and auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // matches favicon.ico, images, files
  ) {
    return NextResponse.next();
  }

  // 2. Authentication check
  if (!session) {
    // If not authenticated and trying to access any private app page, redirect to /login
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Verify session token
  const payload = await verifyToken(session, jwtSecret);

  if (!payload || payload.email !== 'alfitranurr@gmail.com') {
    // Session is invalid, expired, or email does not match. Redirect to /login & clear cookie.
    if (pathname !== '/login') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
    return NextResponse.next();
  }

  // 4. Authenticated user trying to access /login -> redirect to /dashboard
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply proxy to all routes except API files that are not auth related (we want proxy to protect pages)
  matcher: ['/((?!api/jobs|api/interviews).*)'],
};
