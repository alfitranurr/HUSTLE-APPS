import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentAccount, type Account } from './account';
import { DbError, NotFoundError, type DataContext } from './db';
import { createClient } from '@/lib/supabase/server';

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

function toResponse(error: unknown) {
  if (error instanceof HttpError) return fail(error.status, error.message);
  if (error instanceof NotFoundError) return fail(404, error.message);
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    const field = first?.path.join('.');
    return fail(400, field ? `${field}: ${first.message}` : (first?.message ?? 'Invalid request'));
  }
  // Database errors are logged with their code but never sent raw: they can
  // reveal table, column and policy names.
  if (error instanceof DbError) {
    console.error(`[api] database error ${error.code}:`, error.message);
    if (error.code === '23505') return fail(409, 'That already exists.');
    if (error.code === '42501') return fail(403, 'You are not allowed to do that.');
    if (error.code === 'P0002') return fail(404, 'Not found');
    return fail(500, 'Something went wrong. Please try again.');
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[api] unexpected error:', message);
  return fail(500, 'Something went wrong. Please try again.');
}

/**
 * Wraps a route handler with a session + approval check and uniform error
 * handling, and hands it the data context (user's client, so RLS applies).
 * proxy.ts also guards /api and RLS guards the data: defence in depth.
 */
export function withAuth<Ctx = unknown>(handler: (req: NextRequest, ctx: Ctx, data: DataContext) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      const account = await getCurrentAccount();
      if (!account) return fail(401, 'Unauthorized');
      if (account.status !== 'approved') return fail(403, 'Your account is waiting for approval.');
      return await handler(req, ctx, { db: await createClient(), userId: account.id, via: 'session' });
    } catch (error) {
      return toResponse(error);
    }
  };
}

/**
 * Admin-only routes: withAuth plus profiles.is_admin (a column no client can
 * write). Non-admins get 404 so the routes don't advertise themselves. The
 * admin RPCs check again inside the database.
 */
export function withAdmin<Ctx = unknown>(
  handler: (req: NextRequest, ctx: Ctx, data: DataContext, admin: Account) => Promise<Response>
) {
  return withAuth<Ctx>(async (req, ctx, data) => {
    const account = await getCurrentAccount();
    if (!account?.isAdmin) throw new HttpError(404, 'Not found');
    return handler(req, ctx, data, account);
  });
}
