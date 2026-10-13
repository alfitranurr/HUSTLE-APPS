import { NextResponse, type NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/auth';

const PUBLIC_API = new Set(['/api/auth/login']);
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
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Reject cross-site writes to the API (CSRF defence on top of SameSite=Lax).
  if (isApi && !SAFE_METHODS.has(request.method) && isCrossOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  if (isApi && PUBLIC_API.has(pathname)) return NextResponse.next();

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (isApi) {
    return session
      ? NextResponse.next()
      : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (pathname === '/login') {
    return session ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next();
  }

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files served from /public.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
