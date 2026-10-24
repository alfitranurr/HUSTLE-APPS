/**
 * Application and schedule times are wall-clock times in Jakarta (the owner
 * types "15:25" meaning 15:25 WIB). The database keeps them as timestamptz;
 * the API keeps sending the wall-clock string ("2026-05-02T15:25") so the UI's
 * parseDate keeps reading it as local time. Jakarta has no DST: always +07:00.
 */

const OFFSET = '+07:00';
const OFFSET_MS = 7 * 60 * 60 * 1000;

const WALL = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const US_WALL = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const pad = (n: number | string) => String(n).padStart(2, '0');

function valid(y: number, m: number, d: number, h: number, min: number, s: number) {
  const date = new Date(Date.UTC(y, m - 1, d, h, min, s));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d &&
    h < 24 &&
    min < 60 &&
    s < 60
  );
}

/**
 * Wall-clock text (form input, legacy sheet formats) → timestamptz literal in
 * Jakarta time. Text that already carries a zone is passed through as an
 * instant. Returns null for empty or unreadable input.
 */
export function wallToTimestamptz(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  let parts: number[] | null = null;
  let m = v.match(WALL);
  if (m) parts = [+m[1], +m[2], +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)];
  else if ((m = v.match(US_WALL))) parts = [+m[3], +m[1], +m[2], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)];

  if (parts) {
    const [y, mo, d, h, min, s] = parts;
    if (!valid(y, mo, d, h, min, s)) return null;
    return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}${OFFSET}`;
  }
  if (HAS_ZONE.test(v)) {
    const date = new Date(v);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

/** timestamptz from the database → Jakarta wall-clock "yyyy-mm-ddTHH:mm" ('' for null). */
export function timestamptzToWall(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const j = new Date(date.getTime() + OFFSET_MS);
  const base = `${j.getUTCFullYear()}-${pad(j.getUTCMonth() + 1)}-${pad(j.getUTCDate())}T${pad(j.getUTCHours())}:${pad(j.getUTCMinutes())}`;
  return j.getUTCSeconds() ? `${base}:${pad(j.getUTCSeconds())}` : base;
}

/** A date-only value (contract date) → yyyy-mm-dd, or null when empty/unreadable. */
export function toDateOnly(value: string | null | undefined): string | null {
  const ts = wallToTimestamptz(value);
  // Via the wall clock, so an instant with a zone still lands on the Jakarta date.
  return ts ? timestamptzToWall(ts).slice(0, 10) : null;
}
