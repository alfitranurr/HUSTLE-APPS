import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readSession, SESSION_COOKIE } from '@/lib/auth';
import { NotFoundError } from './google/sheet';

/** Thrown inside handlers to return a specific status + user-safe message. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(status: number, error: string, init?: ResponseInit) {
  return NextResponse.json({ success: false, error }, { ...init, status });
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}

function toResponse(error: unknown) {
  if (error instanceof HttpError) return fail(error.status, error.message);
  if (error instanceof NotFoundError) return fail(404, error.message);
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    const field = first?.path.join('.');
    return fail(400, field ? `${field}: ${first.message}` : (first?.message ?? 'Invalid request'));
  }
  // Log only the message: googleapis errors carry request config incl. auth headers.
  const message = error instanceof Error ? error.message : String(error);
  console.error('[api] unexpected error:', message);
  return fail(500, 'Something went wrong. Please try again.');
}

/**
 * Wraps a route handler with a session check and uniform error handling.
 * proxy.ts also guards /api, this is defence in depth.
 */
export function withAuth<Ctx = unknown>(handler: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      if (!(await getSession())) return fail(401, 'Unauthorized');
      return await handler(req, ctx);
    } catch (error) {
      return toResponse(error);
    }
  };
}
