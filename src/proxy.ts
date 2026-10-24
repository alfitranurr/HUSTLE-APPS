import { NextResponse, type NextRequest } from 'next/server';
import { updateSession, withSessionCookies } from '@/lib/supabase/proxy';

/** Signed-out pages: a signed-in visitor is sent on to the app instead. */
const GUEST_PAGES = new Set(['/login', '/signup', '/forgot-password']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isCrossOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.nextUrl.host;
  } catch {
    return true; // "null" or malformed origin
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Reject cross-site writes (CSRF defence on top of SameSite=Lax cookies).
  if ((isApi || pathname === '/auth/signout') && !SAFE_METHODS.has(request.method) && isCrossOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { response, userId } = await updateSession(request);

  // Email links land here before a session exists.
  if (pathname.startsWith('/auth/')) return response;

  if (isApi) {
    return userId
      ? response
      : withSessionCookies(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }), response);
  }

  if (GUEST_PAGES.has(pathname)) {
    return userId ? withSessionCookies(NextResponse.redirect(new URL('/dashboard', request.url)), response) : response;
  }

  if (!userId) {
    const login = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/dashboard') login.searchParams.set('next', `${pathname}${search}`);
    return withSessionCookies(NextResponse.redirect(login), response);
  }

  return response;
}

export const config = {
  // Everything except Next internals and static files served from /public.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
