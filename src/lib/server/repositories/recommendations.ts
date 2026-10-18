import 'server-only';
import { RECOMMENDATION_STATUSES } from '@/lib/constants';
import { normalise } from '@/lib/matching';
import type { ParsedJob, Recommendation, RecommendationSource, RecommendationStatus } from '@/lib/types';
import { appendRows, columnLetter, ensureSheet, NotFoundError, readValues, writeValues } from '../google/sheet';

/** Settings key holding when Gmail was last synced. */
export const GMAIL_SYNC_KEY = 'gmailLastSync';

const SHEET = 'Recommendations';
const COLUMNS = ['ID', 'Title', 'Company', 'Location', 'Url', 'Source', 'ReceivedAt', 'Status'] as const;
const LAST = columnLetter(COLUMNS.length);
const STATUS_COLUMN = columnLetter(COLUMNS.indexOf('Status') + 1);

function toRecommendation(cells: string[]): Recommendation {
  const [id, title, company, location, url, source, receivedAt, status] = cells;
  return {
    id: id ?? '',
    title: title ?? '',
    company: company ?? '',
    location: location ?? '',
    url: url ?? '',
    source: source === 'email' ? 'email' : 'paste',
    receivedAt: receivedAt ?? '',
    status: (RECOMMENDATION_STATUSES as readonly string[]).includes(status) ? (status as RecommendationStatus) : 'new',
  };
}

const toCells = (r: Recommendation) => [r.id, r.title, r.company, r.location, r.url, r.source, r.receivedAt, r.status];

/** The same job can arrive by email (with an id) and by paste (without one). */
const sameJobKey = (r: Pick<ParsedJob, 'title' | 'company'>) => `${normalise(r.title)}|${normalise(r.company)}`;

async function readAll() {
  await ensureSheet(SHEET, COLUMNS);
  return (await readValues(`${SHEET}!A2:${LAST}`))
    .map((cells, i) => ({ item: toRecommendation(cells), row: i + 2 }))
    .filter(({ item }) => item.id && item.title);
}

export async function listRecommendations(): Promise<Recommendation[]> {
  return (await readAll()).map(({ item }) => item);
}

/** Stores jobs not seen before; returns how many were new. One Sheets append for the whole batch. */
export async function addRecommendations(
  batches: { jobs: ParsedJob[]; source: RecommendationSource; receivedAt: string }[]
): Promise<{ found: number; added: number }> {
  const existing = await readAll();
  const ids = new Set(existing.map(({ item }) => item.id));
  const keys = new Set(existing.map(({ item }) => sameJobKey(item)));
  const fresh: Recommendation[] = [];
  let found = 0;

  for (const { jobs, source, receivedAt } of batches) {
    for (const job of jobs) {
      found++;
      const key = sameJobKey(job);
      if (ids.has(job.id) || keys.has(key)) continue;
      ids.add(job.id);
      keys.add(key);
      fresh.push({ ...job, source, receivedAt, status: 'new' });
    }
  }
  await appendRows(`${SHEET}!A:${LAST}`, fresh.map(toCells));
  return { found, added: fresh.length };
}

export async function setRecommendationStatus(id: string, status: RecommendationStatus): Promise<Recommendation> {
  const found = (await readAll()).find(({ item }) => item.id === id);
  if (!found) throw new NotFoundError('Recommendation not found');
  await writeValues(`${SHEET}!${STATUS_COLUMN}${found.row}`, [[status]]);
  return { ...found.item, status };
}
