import type { ParsedJob } from '@/lib/types';
import { jobsFromLines } from './jobLines';

const JOB_LINK = /linkedin\.com\/(?:comm\/)?jobs\/view\/(\d{6,})/i;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  bull: '•',
  ndash: '–',
  mdash: '—',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** HTML email -> text lines, with a `[[job:ID]]` line before every LinkedIn job link. */
export function htmlToLines(html: string): string[] {
  const text = html
    .replace(/<(head|style|script|title)[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi, (_m, href: string) => {
      const id = JOB_LINK.exec(decodeEntities(href))?.[1];
      return id ? `\n[[job:${id}]]\n` : '\n';
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|td|th|tr|li|h[1-6]|a|span|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(text).split(/\r?\n/);
}

/** Plain-text email or pasted page -> lines, turning LinkedIn job URLs into `[[job:ID]]` lines. */
export function textToLines(text: string): string[] {
  return text.split(/\r?\n/).flatMap((line) => {
    const id = JOB_LINK.exec(line)?.[1];
    if (!id) return [line];
    // Keep any words before the link ("View job: https://...") out of the job fields.
    return [`[[job:${id}]]`];
  });
}

/** A LinkedIn recommendations / job alert email, preferring the HTML part. */
export function parseRecommendationEmail(parts: { html?: string; text?: string }): ParsedJob[] {
  const fromHtml = parts.html ? jobsFromLines(htmlToLines(parts.html)) : [];
  if (fromHtml.length > 0) return fromHtml;
  return parts.text ? jobsFromLines(textToLines(parts.text)) : [];
}

/** Text copied from LinkedIn's "Top job picks for you" page (Ctrl+A, Ctrl+C). */
export function parsePastedJobs(text: string): ParsedJob[] {
  return jobsFromLines(textToLines(text));
}
