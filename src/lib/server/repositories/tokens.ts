import 'server-only';
import type { ApiTokenInfo } from '@/lib/types';
import { generateToken } from '../apiToken';
import { DbError, must, NotFoundError, type DataContext } from '../db';
import { HttpError } from '../http';
import { isUuid } from '../proofs';

/**
 * The user's own API tokens, always with the session client (RLS). Columns
 * are listed explicitly: token_hash isn't readable by clients at all.
 */
const SELECT = 'id, name, token_prefix, created_at, last_used_at, revoked_at';

interface TokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const iso = (value: string | null) => (value ? new Date(value).toISOString() : '');

function toInfo(row: TokenRow): ApiTokenInfo {
  return {
    id: row.id,
    name: row.name,
    prefix: row.token_prefix,
    createdAt: iso(row.created_at),
    lastUsedAt: iso(row.last_used_at),
    revokedAt: iso(row.revoked_at),
  };
}

function sessionOnly(ctx: DataContext) {
  if (ctx.via !== 'session') throw new HttpError(403, 'Tokens can only be managed while signed in.');
}

export async function listTokens(ctx: DataContext): Promise<ApiTokenInfo[]> {
  sessionOnly(ctx);
  const rows = must(
    await ctx.db.from('api_tokens').select(SELECT).eq('user_id', ctx.userId).order('created_at', { ascending: false })
  ) as TokenRow[];
  return rows.map(toInfo);
}

/** Creates a token and returns it in full: the only time it is ever visible. */
export async function createToken(ctx: DataContext, name: string): Promise<{ token: string; info: ApiTokenInfo }> {
  sessionOnly(ctx);
  const { token, prefix, hash } = generateToken();
  try {
    const row = must(
      await ctx.db.from('api_tokens').insert({ name, token_prefix: prefix, token_hash: hash }).select(SELECT).single()
    ) as TokenRow;
    return { token, info: toInfo(row) };
  } catch (error) {
    // The 5-active-tokens rule lives in a trigger (private.enforce_api_token_rules).
    if (error instanceof DbError && error.code === '23514' && error.message.includes('at most 5')) {
      throw new HttpError(409, 'You can have at most 5 access keys in use. Turn one off first.');
    }
    throw error;
  }
}

/** Revoking is permanent; the row stays so "last used" history is kept. */
export async function revokeToken(ctx: DataContext, id: string): Promise<void> {
  sessionOnly(ctx);
  if (!isUuid(id)) throw new NotFoundError('Token not found');
  const rows = must(
    await ctx.db
      .from('api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', ctx.userId)
      .eq('id', id)
      .is('revoked_at', null)
      .select('id')
  );
  if (rows.length === 0) throw new NotFoundError('Token not found or already revoked');
}
