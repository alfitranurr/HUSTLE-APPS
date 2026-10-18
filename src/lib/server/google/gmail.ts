import 'server-only';
import type { gmail_v1 } from 'googleapis';
import { gmail, hasOwnerOAuth } from './client';

/**
 * Reads LinkedIn's "Jobs recommended for you" emails (the same profile-based
 * picks as the LinkedIn home page). Read-only, and the query only ever matches
 * LinkedIn's job-recommendation senders; message bodies are parsed in memory
 * and never logged or stored.
 */

/** Senders of LinkedIn's recommendation emails (keyword job alerts come from jobalerts-noreply and are left out). */
const SENDERS = ['jobs-noreply@linkedin.com', 'jobs-listings@linkedin.com'];
const QUERY = `from:(${SENDERS.join(' OR ')})`;

/** Gmail isn't usable yet: no owner OAuth, Gmail API off, or the token lacks gmail.readonly. */
export class GmailNotConfiguredError extends Error {}

export interface RecommendationEmail {
  id: string;
  receivedAt: string;
  html?: string;
  text?: string;
}

const decode = (data?: string | null) => (data ? Buffer.from(data, 'base64url').toString('utf8') : undefined);

function bodies(part: gmail_v1.Schema$MessagePart | undefined, found: { html?: string; text?: string } = {}) {
  if (!part) return found;
  if (part.mimeType === 'text/html' && !found.html) found.html = decode(part.body?.data);
  if (part.mimeType === 'text/plain' && !found.text) found.text = decode(part.body?.data);
  for (const child of part.parts ?? []) bodies(child, found);
  return found;
}

function isPermissionError(error: unknown): boolean {
  const e = error as { code?: number; status?: number; errors?: { reason?: string }[]; message?: string };
  const status = e.code ?? e.status;
  const reason = e.errors?.[0]?.reason ?? '';
  return (
    status === 401 ||
    status === 403 ||
    /insufficient|accessNotConfigured|SERVICE_DISABLED|has not been used/i.test(`${reason} ${e.message ?? ''}`)
  );
}

/** Up to `max` recommendation emails from the last `days` days, newest first. */
export async function fetchRecommendationEmails(days = 30, max = 25): Promise<RecommendationEmail[]> {
  if (!hasOwnerOAuth()) throw new GmailNotConfiguredError('Gmail needs the owner Google OAuth token');
  const api = gmail();
  try {
    const list = await api.users.messages.list({ userId: 'me', q: `${QUERY} newer_than:${days}d`, maxResults: max });
    const ids = (list.data.messages ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));

    const emails: RecommendationEmail[] = [];
    // A few at a time keeps well inside Gmail's per-user rate limit.
    for (let i = 0; i < ids.length; i += 5) {
      const batch = await Promise.all(
        ids.slice(i, i + 5).map((id) => api.users.messages.get({ userId: 'me', id, format: 'full' }))
      );
      for (const { data } of batch) {
        if (!data.id) continue;
        const receivedAt = new Date(Number(data.internalDate ?? Date.now())).toISOString();
        emails.push({ id: data.id, receivedAt, ...bodies(data.payload) });
      }
    }
    return emails;
  } catch (error) {
    if (isPermissionError(error)) throw new GmailNotConfiguredError('Gmail access is not set up');
    throw error;
  }
}
