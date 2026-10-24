import 'server-only';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

/**
 * Who a repository call acts for. With a session, `db` is the user's own
 * client and RLS isolates the data. With an API token (tahap 4) it is the
 * secret-key client, so every query must also filter on `userId`: the
 * repositories always do, which keeps both paths identical.
 */
export interface DataContext {
  db: SupabaseClient;
  userId: string;
  via: 'session' | 'token';
}

export class NotFoundError extends Error {}

/** A database error. Its message is logged, never sent to the client. */
export class DbError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

/** Unwraps a Supabase result, turning its error into a DbError. */
export function must<T>(result: { data: T; error: PostgrestError | null }): NonNullable<T> {
  if (result.error) throw new DbError(result.error.message, result.error.code);
  return result.data as NonNullable<T>;
}

/**
 * Row for an insert. A session client can't write user_id (column grants;
 * it defaults to auth.uid()), while the token path must set it explicitly.
 */
export function owned<T extends object>(ctx: DataContext, row: T): T & { user_id?: string } {
  return ctx.via === 'token' ? { ...row, user_id: ctx.userId } : row;
}
