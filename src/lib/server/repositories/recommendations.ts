import 'server-only';
import { normalise } from '@/lib/matching';
import type { ParsedJob, Recommendation, RecommendationSource, RecommendationStatus } from '@/lib/types';
import { must, NotFoundError, owned, type DataContext } from '../db';

interface RecommendationRow {
  external_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  received_at: string;
  status: string;
}

const SELECT = 'external_id, title, company, location, url, source, received_at, status';

/** The API keeps using the LinkedIn id (or hash) as the recommendation id. */
function toRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.external_id,
    title: row.title,
    company: row.company,
    location: row.location,
    url: row.url,
    source: row.source as RecommendationSource,
    receivedAt: new Date(row.received_at).toISOString(),
    status: row.status as RecommendationStatus,
  };
}

/** The same job can arrive with an id and without one (pasted text). */
const sameJobKey = (r: Pick<ParsedJob, 'title' | 'company'>) => `${normalise(r.title)}|${normalise(r.company)}`;

export async function listRecommendations(ctx: DataContext): Promise<Recommendation[]> {
  const rows = must(
    await ctx.db
      .from('recommendations')
      .select(SELECT)
      .eq('user_id', ctx.userId)
      .order('received_at', { ascending: false })
  ) as RecommendationRow[];
  return rows.map(toRecommendation);
}

/** Stores jobs not seen before; returns how many were found and how many were new. */
export async function addRecommendations(
  ctx: DataContext,
  batches: { jobs: ParsedJob[]; source: RecommendationSource; receivedAt: string }[]
): Promise<{ found: number; added: number }> {
  const existing = must(
    await ctx.db.from('recommendations').select('external_id, dedupe_key').eq('user_id', ctx.userId)
  ) as { external_id: string; dedupe_key: string }[];
  const ids = new Set(existing.map((r) => r.external_id));
  const keys = new Set(existing.map((r) => r.dedupe_key));
  const fresh: Record<string, string>[] = [];
  let found = 0;

  for (const { jobs, source, receivedAt } of batches) {
    for (const job of jobs) {
      found++;
      const key = sameJobKey(job);
      if (ids.has(job.id) || keys.has(key)) continue;
      ids.add(job.id);
      keys.add(key);
      fresh.push(
        owned(ctx, {
          external_id: job.id,
          dedupe_key: key,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          source,
          received_at: receivedAt,
        })
      );
    }
  }
  if (fresh.length) must(await ctx.db.from('recommendations').insert(fresh));
  return { found, added: fresh.length };
}

export async function setRecommendationStatus(
  ctx: DataContext,
  id: string,
  status: RecommendationStatus
): Promise<Recommendation> {
  const row = must(
    await ctx.db
      .from('recommendations')
      .update({ status })
      .eq('user_id', ctx.userId)
      .eq('external_id', id)
      .select(SELECT)
      .maybeSingle()
  ) as RecommendationRow | null;
  if (!row) throw new NotFoundError('Recommendation not found');
  return toRecommendation(row);
}
