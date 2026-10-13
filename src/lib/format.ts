import type { Job } from './types';

const LOCALE = 'en-GB';
const DAY_MS = 24 * 60 * 60 * 1000;

const ISO_LIKE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const US_LIKE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function localDate(y: number, m: number, d: number, h = '0', min = '0', s = '0') {
  const date = new Date(y, m - 1, d, Number(h), Number(min), Number(s));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parses the date formats found in the sheet: "2026-05-02 15:25",
 * "2026-05-02T15:25" (form input), "5/24/2026 7:18:03" (Sheets) and full ISO.
 * Explicit parsing keeps Safari, which rejects "YYYY-MM-DD HH:mm", happy.
 */
export function parseDate(value?: string | null): Date | null {
  const v = value?.trim();
  if (!v) return null;
  let m = v.match(ISO_LIKE);
  if (m) return localDate(+m[1], +m[2], +m[3], m[4], m[5], m[6]);
  m = v.match(US_LIKE);
  if (m) return localDate(+m[3], +m[1], +m[2], m[4], m[5], m[6]);
  const date = new Date(v);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | Date | null): string {
  const date = value instanceof Date ? value : parseDate(value);
  return date ? date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function formatDateTime(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '—';
  return `${formatDate(date)}, ${date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "today", "tomorrow", "in 3 days", "2 weeks ago"... */
export function formatRelative(value?: string | Date | null, now = new Date()): string {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return '';
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (Math.abs(days) < 14) return relative.format(days, 'day');
  if (Math.abs(days) < 60) return relative.format(Math.round(days / 7), 'week');
  return relative.format(Math.round(days / 30), 'month');
}

/** Value for <input type="datetime-local">. */
export function toDateTimeLocal(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function shortProvince(province: string): string {
  return province.replace(/^Daerah Khusus Ibukota\s+/i, 'DKI ').replace(/^Daerah Istimewa\s+/i, 'DI ');
}

export function formatLocation(job: Pick<Job, 'city' | 'province'>): string {
  const parts = [job.city, job.province && shortProvince(job.province)].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
