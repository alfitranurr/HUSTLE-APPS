import type { ParsedJob } from '@/lib/types';

/**
 * Turns LinkedIn job cards written out as lines (a recommendations email, or
 * the "Top job picks for you" page copied with Ctrl+A) into jobs.
 *
 * Every card ends with a location line ("Jakarta, Indonesia (On-site)"), so
 * the location is the anchor: the two meaningful lines before it are the
 * title and the company. Lines like "Promoted" or "12 applicants" are skipped.
 * `[[job:ID]]` marker lines carry LinkedIn job ids found in links.
 */

const COUNTRIES =
  'Indonesia|Singapore|Malaysia|Philippines|Thailand|Vietnam|Australia|Japan|India|China|Hong Kong|Taiwan|South Korea|United States|United Kingdom|Germany|Netherlands|Canada|United Arab Emirates|Saudi Arabia|Qatar';
const WORKPLACE = /\((on-site|onsite|remote|hybrid)\)\s*$/i;
const ENDS_WITH_COUNTRY = new RegExp(`(^|,\\s*)(${COUNTRIES})\\s*(\\((on-site|onsite|remote|hybrid)\\))?$`, 'i');
const REMOTE_ONLY = /^(remote|hybrid|on-site)$/i;

const NOISE = [
  /^(promoted|easy apply|viewed|applied|saved|new|apply|apply now|view job|view jobs|save|dismiss|show more|show less|see all jobs|see more jobs)$/i,
  /^(actively (reviewing|recruiting)( applicants)?|be an early applicant|top applicant|in your network)$/i,
  /^\d[\d,.]*\+?\s+(applicants?|connections?|school alumni|company alumni|employees?)\b/i,
  /\b(alumni|connections?) work(s)? here$/i,
  /^(over\s+)?\d+\s+(people\s+)?(clicked apply|applicants?)$/i,
  /^(reposted\s+)?\d+\s+(seconds?|minutes?|hours?|days?|weeks?|months?)\s+ago$/i,
  /\bwith verification$/i,
  /^(top job picks for you|recommended for you|jobs you may be interested in|your job alert.*|based on your profile.*)$/i,
  /^\d[\d,]*\s+results?$/i,
  /^(response insights|how you match|skills match)\b/i,
  /^(rp|idr|\$|usd|sgd)\s?[\d.,]+/i,
  /^[·•|]+$/,
];

const MARKER = /^\[\[job:(\d+)\]\]$/;

export const isNoise = (line: string) => NOISE.some((re) => re.test(line));
/** A card's location line; sentences from a job description ("Location: …", long lines) don't count. */
export const isLocation = (line: string) =>
  line.length <= 80 && !line.includes(':') && (WORKPLACE.test(line) || ENDS_WITH_COUNTRY.test(line) || REMOTE_ONLY.test(line));

/** Stable id for jobs without a LinkedIn id (FNV-1a over the normalised fields). */
export function jobHash(title: string, company: string, location: string): string {
  const text = [title, company, location].map((s) => s.trim().toLowerCase()).join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `h_${hash.toString(16).padStart(8, '0')}`;
}

export const jobUrl = (id: string) => `https://www.linkedin.com/jobs/view/${id}/`;

const clean = (line: string) => line.replace(/\s+/g, ' ').trim();
/** Card fields are short labels, not sentences. */
const plausible = (text: string, max: number) =>
  text.length >= 2 && text.length <= max && /[a-z]/i.test(text) && !/[.!?:]$/.test(text);

interface Entry {
  text: string;
  /** LinkedIn job id from the most recent link seen before this line. */
  marker?: string;
}

export function jobsFromLines(rawLines: string[]): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  const seen = new Set<string>();
  let buffer: Entry[] = [];
  let pendingMarker: string | undefined;

  const emit = (title: string, company: string, location: string, marker?: string) => {
    if (!plausible(title, 100) || !plausible(company, 80) || title.toLowerCase() === company.toLowerCase()) return;
    const id = marker ?? jobHash(title, company, location);
    if (seen.has(id)) return;
    seen.add(id);
    jobs.push({ id, title, company, location, url: marker ? jobUrl(marker) : '' });
  };

  for (const raw of rawLines) {
    const line = clean(raw);
    if (!line) continue;

    const marker = MARKER.exec(line)?.[1];
    if (marker) {
      // Plain-text emails put the link after the card: give it to the job just emitted.
      const last = jobs.at(-1);
      if (last && buffer.length === 0 && last.id.startsWith('h_')) {
        seen.delete(last.id);
        last.id = marker;
        last.url = jobUrl(marker);
        seen.add(marker);
      } else {
        pendingMarker = marker;
      }
      continue;
    }
    if (isNoise(line)) continue;

    // "Company · Jakarta, Indonesia" on one line (common in emails).
    const parts = line.split(/\s+[·•|]\s+/);
    if (parts.length >= 2 && isLocation(parts.at(-1)!)) {
      const title = buffer.at(-1);
      if (title) emit(title.text, parts.slice(0, -1).join(' · '), parts.at(-1)!, title.marker);
      buffer = [];
      continue;
    }

    if (isLocation(line)) {
      const company = buffer.at(-1);
      const title = buffer.at(-2);
      if (title && company) emit(title.text, company.text, line, title.marker ?? company.marker);
      buffer = [];
      continue;
    }

    // LinkedIn repeats the title (e.g. once for screen readers); keep one copy.
    if (buffer.at(-1)?.text === line) continue;
    buffer.push({ text: line, marker: pendingMarker });
    if (buffer.length > 8) buffer = buffer.slice(-8);
    pendingMarker = undefined;
  }
  return jobs;
}
