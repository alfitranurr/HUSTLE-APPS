import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

// POST only: a GET logout can be triggered cross-site by any link or <img>.
export async function POST() {
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return response;
}
