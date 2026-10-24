import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from './apiToken';
import type { DataContext } from './db';
import { HttpError } from './http';
import { limitTokenRequest } from './tokenRateLimit';

/**
 * The one place a request may bypass RLS: a valid API token resolves to its
 * owner and gets the secret-key client. Everything downstream (repositories,
 * proof files) filters on that userId, and tokenAllowed() keeps the token to
 * listing, adding and updating applications.
 *
 * Unknown, revoked and tokens of pending/suspended accounts all resolve to
 * nothing (public.verify_api_token), so they get the same 401.
 */
export async function tokenContext(token: string): Promise<DataContext> {
  const hash = hashToken(token);
  const limit = await limitTokenRequest(hash.slice(0, 16));
  if (!limit.allowed) {
    throw new HttpError(429, `Too many requests for this token. Try again in ${limit.retryAfterSeconds}s.`);
  }

  const db = createAdminClient();
  const { data: userId, error } = await db.rpc('verify_api_token', { p_token_hash: hash });
  if (error) throw new Error(`token check failed: ${error.message}`);
  if (typeof userId !== 'string') throw new HttpError(401, 'Invalid or revoked API token.');
  return { db, userId, via: 'token' };
}
