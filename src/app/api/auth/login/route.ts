import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionCookieOptions, signSession } from '@/lib/auth';
import { getAuthEnv } from '@/lib/env';
import { fail } from '@/lib/server/http';
import { clientIp, rateLimit, resetRateLimit } from '@/lib/server/rateLimit';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(256),
});

function safeEqual(a: string, b: string) {
  // Hash first so both buffers have equal length and the compare is constant time.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const limiterKey = `login:${clientIp(req.headers)}`;
  const limit = rateLimit(limiterKey, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return fail(429, 'Too many login attempts. Please try again later.', {
      headers: { 'Retry-After': String(limit.retryAfterSeconds) },
    });
  }

  const parsed = credentialsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, 'Email and password are required.');

  try {
    const env = getAuthEnv();
    const emailOk = safeEqual(parsed.data.email, env.OWNER_EMAIL);
    const passwordOk = safeEqual(parsed.data.password, env.LOGIN_PASSWORD);
    if (!emailOk || !passwordOk) return fail(401, 'Invalid email or password.');

    resetRateLimit(limiterKey);
    const token = await signSession(
      { sub: env.OWNER_EMAIL, exp: Date.now() + SESSION_TTL_SECONDS * 1000 },
      env.JWT_SECRET
    );

    const response = NextResponse.json({ success: true, data: null });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_SECONDS));
    return response;
  } catch (error) {
    console.error('[auth] login failed:', error instanceof Error ? error.message : error);
    return fail(500, 'Something went wrong. Please try again.');
  }
}
