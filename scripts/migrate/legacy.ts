/**
 * Pure mapping from the old Google Sheet rows to Supabase rows (no I/O, so it
 * is unit-tested). Mirrors the reading rules of the old Sheets repositories:
 * header lookup with the linkother alias, status/stage normalisation, applied
 * date falling back to the Timestamp, 'No File' meaning no attachment.
 */
import { DIFFICULTIES, INTERVIEW_CATEGORIES, JOB_STAGES, JOB_STATUSES, type JobStage, type JobStatus } from '../../src/lib/constants';
import { toDateOnly, wallToTimestamptz } from '../../src/lib/jakartaTime';
import { normalise } from '../../src/lib/matching';
import { parseStageDates } from '../../src/lib/stageDates';

export const JOB_COLUMNS = [
  'ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web', 'Kategori',
  'Note', 'BuktiURL', 'Platform', 'CareerLevel', 'CurrentStage', 'Province', 'City', 'OtherLink', 'LastUpdated',
  'ContractDate', 'StageDates',
] as const;
export type JobColumn = (typeof JOB_COLUMNS)[number];

const headerKey = (h: string) => h.replace(/\s+/g, '').toLowerCase();

/** Column index by header name, falling back to the canonical position (old readAll logic). */
export function jobColumnIndex(header: string[]): Map<JobColumn, number> {
  const keys = header.map(headerKey);
  return new Map(
    JOB_COLUMNS.map((column, position) => {
      const aliases = column === 'OtherLink' ? ['otherlink', 'linkother'] : [headerKey(column)];
      const found = keys.findIndex((h) => aliases.includes(h));
      return [column, found >= 0 ? found : position];
    })
  );
}

export function normalizeStatus(raw: string): JobStatus {
  const s = raw.trim().toLowerCase();
  const exact = JOB_STATUSES.find((status) => status.toLowerCase() === s);
  if (exact) return exact;
  if (s === 'done' || s.includes('success')) return 'Success';
  if (s.includes('fail') || s.includes('declin') || s.includes('reject')) return 'Failed';
  if (s === 'progress' || s.includes('progress') || s.includes('psikotes') || s.includes('interview')) return 'In Progress';
  return 'Not Started';
}

export function normalizeStage(raw: string): JobStage {
  const s = raw.trim().toLowerCase();
  const exact = JOB_STAGES.find((stage) => stage.toLowerCase() === s);
  if (exact) return exact;
  if (['online test', 'technical test', 'psikotes'].includes(s)) return 'Assessment Test';
  if (s === 'presentation round') return 'FGD/LGD';
  return 'Not Started';
}

/** Splits the stored attachment cell ("url1, url2" or "No File") into URLs. */
export function splitAttachmentCell(cell?: string): string[] {
  if (!cell || cell === 'No File') return [];
  return cell
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && url !== 'No File');
}

export function driveFileId(url: string): string | null {
  if (!/drive\.google\.com|docs\.google\.com/.test(url)) return null;
  return url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

/** Same rule as the form: add https:// when missing; null when it still isn't a usable http(s) URL. */
export function normalizeLink(value: string): string | null {
  const v = value.trim();
  if (!v) return '';
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
  if (candidate.length > 2048) return null;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') ? candidate : null;
  } catch {
    return null;
  }
}

export interface Issues {
  add: (message: string) => void;
}

/**
 * Undoes an old case-insensitive find/replace "done" → "In Progress" in the
 * Sheet (approved by the owner, 24 Oct 2026):
 * - inside a word ("InIn Progresssia", "lokerinIn Progresssia") it was "done",
 *   which gives back "Indonesia" / "lokerindonesia";
 * - in notes, a line ticked off with ✅ ("1. In Progress Submission ✅") said "Done".
 */
export function repairText(value: string, isNote: boolean): string {
  let fixed = value.replace(/(?<=[A-Za-z])In Progress|In Progress(?=[A-Za-z])/g, 'done');
  if (isNote) fixed = fixed.replace(/\bIn Progress\b(?=[^\n]*✅)/g, 'Done');
  return fixed;
}

function fit(value: string, max: number, label: string, issues: Issues): string {
  const v = value.trim();
  if (v.length <= max) return v;
  issues.add(`${label} shortened from ${v.length} to ${max} characters`);
  return v.slice(0, max);
}

export interface MappedJob {
  legacyId: string;
  row: {
    legacy_id: string;
    company: string;
    position: string;
    applied_at: string;
    scheduled_at: string | null;
    contract_date: string | null;
    stage_dates: Record<string, string>;
    status: JobStatus;
    stage: JobStage;
    platform: string;
    career_level: string;
    province: string;
    city: string;
    note: string;
    link_instagram: string;
    link_linkedin: string;
    link_website: string;
    link_other: string;
    created_at: string;
    updated_at: string;
  };
  /** Drive file ids to copy into Storage. */
  driveFiles: string[];
}

/**
 * One DataLowongan row → a jobs row. Returns null for rows the old app also
 * skipped (no company). Anything that had to be adjusted is reported.
 */
export function mapJobRow(raw: (column: JobColumn) => string, rowNumber: number, issues: Issues): MappedJob | null {
  const repaired: JobColumn[] = [];
  const get = (column: JobColumn) => {
    const value = raw(column);
    if (column === 'Status' || column === 'CurrentStage') return value;
    const fixed = repairText(value, column === 'Note');
    if (fixed !== value && !repaired.includes(column)) repaired.push(column);
    return fixed;
  };
  const company = get('Company').trim();
  if (!company) return null;
  const where = `Row ${rowNumber} (${company})`;
  const note = (msg: string) => issues.add(`${where}: ${msg}`);
  const local: Issues = { add: note };

  const legacyId = get('ID').trim() || `ROW-${rowNumber}`;
  if (!get('ID').trim()) note(`no ID, using ${legacyId}`);

  const created = wallToTimestamptz(get('Timestamp'));
  const applied = wallToTimestamptz(get('StartDate')) ?? created;
  const updated = wallToTimestamptz(get('LastUpdated')) ?? created;
  if (get('StartDate').trim() && !wallToTimestamptz(get('StartDate'))) note(`unreadable StartDate "${get('StartDate')}"`);
  if (!applied) note('no readable application date or Timestamp; using the migration time');
  const fallback = new Date().toISOString();

  const scheduledRaw = get('EndDate');
  const scheduled = wallToTimestamptz(scheduledRaw);
  if (scheduledRaw.trim() && !scheduled) note(`unreadable EndDate "${scheduledRaw}" dropped`);
  const contractRaw = get('ContractDate');
  const contract = toDateOnly(contractRaw);
  if (contractRaw.trim() && !contract) note(`unreadable ContractDate "${contractRaw}" dropped`);

  let noteText = get('Note');
  const extra: string[] = [];
  const link = (column: JobColumn) => {
    const value = normalizeLink(get(column));
    if (value === null) {
      note(`invalid ${column} link moved to the note`);
      extra.push(`${column}: ${get(column).trim()}`);
      return '';
    }
    return value;
  };
  const links = {
    link_instagram: link('Instagram'),
    link_linkedin: link('LinkedIn'),
    link_website: link('Web'),
    link_other: link('OtherLink'),
  };

  const driveFiles: string[] = [];
  for (const url of splitAttachmentCell(get('BuktiURL'))) {
    const id = driveFileId(url);
    if (id) {
      if (!driveFiles.includes(id)) driveFiles.push(id);
    } else if (!links.link_other && normalizeLink(url)) {
      links.link_other = normalizeLink(url)!;
      note('non-Drive attachment URL kept as "Other link"');
    } else {
      extra.push(`Attachment: ${url}`);
      note('non-Drive attachment URL moved to the note');
    }
  }
  if (extra.length) noteText = [noteText.trim(), ...extra].filter(Boolean).join('\n');
  if (repaired.length) note(`repaired "done" → "In Progress" damage in ${repaired.join(', ')}`);

  return {
    legacyId,
    driveFiles,
    row: {
      legacy_id: fit(legacyId, 100, `${where}: ID`, issues),
      company: fit(company, 200, `${where}: company`, issues),
      position: fit(get('Kategori'), 200, 'position', local),
      applied_at: applied ?? fallback,
      scheduled_at: scheduled,
      contract_date: contract,
      stage_dates: parseStageDates(get('StageDates')) as Record<string, string>,
      status: normalizeStatus(get('Status')),
      stage: normalizeStage(get('CurrentStage')),
      platform: fit(get('Platform'), 80, 'platform', local),
      career_level: fit(get('CareerLevel'), 80, 'career level', local),
      province: fit(get('Province'), 120, 'province', local),
      city: fit(get('City'), 120, 'city', local),
      note: fit(noteText, 5000, 'note', local),
      ...links,
      created_at: created ?? applied ?? fallback,
      updated_at: updated ?? applied ?? fallback,
    },
  };
}

/** Makes legacy ids unique within one import (the database enforces it per user). */
export function dedupeLegacyIds<T extends { legacyId: string; row: { legacy_id: string } }>(items: T[], issues: Issues): T[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const count = (seen.get(item.row.legacy_id) ?? 0) + 1;
    seen.set(item.row.legacy_id, count);
    if (count > 1) {
      const next = `${item.row.legacy_id}-dup${count}`;
      issues.add(`duplicate ID ${item.row.legacy_id} renamed to ${next}`);
      item.row.legacy_id = next;
      item.legacyId = next;
    }
  }
  return items;
}

// --- Interviews -------------------------------------------------------------------

export function mapQuestionRow(cells: string[], rowNumber: number, issues: Issues) {
  const [id = '', category = '', question = '', situation = '', task = '', action = '', result = '', targetCompany = '',
    difficulty = '', status = '', notes = '', lastPracticed = '', practiceCount = ''] = cells;
  if (!id.trim() || !question.trim()) return null;
  const local: Issues = { add: (m) => issues.add(`Interviews row ${rowNumber}: ${m}`) };
  const count = Math.max(0, Number.parseInt(practiceCount, 10) || 0);
  return {
    legacy_id: fit(id, 100, 'ID', local),
    category: (INTERVIEW_CATEGORIES as readonly string[]).includes(category) ? category : 'HR / General',
    question: fit(question, 1000, 'question', local),
    situation: fit(situation, 3000, 'situation', local),
    task: fit(task, 3000, 'task', local),
    action: fit(action, 3000, 'action', local),
    result: fit(result, 3000, 'result', local),
    target_company: fit(targetCompany, 200, 'target company', local),
    difficulty: (DIFFICULTIES as readonly string[]).includes(difficulty) ? difficulty : 'Medium',
    status: status === 'Mastered' ? 'Mastered' : 'Practice Needed',
    notes: fit(notes, 3000, 'notes', local),
    practice_count: count,
    last_practiced_at: wallToTimestamptz(lastPracticed),
  };
}

// --- Recommendations --------------------------------------------------------------

/** Same key the app uses to spot one job arriving twice. */
export const dedupeKey = (title: string, company: string) => `${normalise(title)}|${normalise(company)}`;

export function mapRecommendationRow(cells: string[], rowNumber: number, issues: Issues) {
  const [id = '', title = '', company = '', location = '', url = '', source = '', receivedAt = '', status = ''] = cells;
  if (!id.trim() || !title.trim()) return null;
  const local: Issues = { add: (m) => issues.add(`Recommendations row ${rowNumber}: ${m}`) };
  let safeUrl = url.trim().replace(/^http:\/\//i, 'https://');
  if (safeUrl && !/^https:\/\//i.test(safeUrl)) {
    local.add('URL without https dropped');
    safeUrl = '';
  }
  return {
    external_id: fit(id, 100, 'ID', local),
    dedupe_key: dedupeKey(title, company).slice(0, 600),
    title: fit(title, 300, 'title', local),
    company: fit(company, 300, 'company', local),
    location: fit(location, 200, 'location', local),
    url: safeUrl.slice(0, 2048),
    source: source === 'email' ? 'email' : 'paste',
    received_at: wallToTimestamptz(receivedAt) ?? new Date().toISOString(),
    status: ['new', 'added', 'dismissed'].includes(status) ? status : 'new',
  };
}

// --- Profile + settings (key/value tabs) ------------------------------------------

const parseList = (value: string | undefined, max: number): string[] => {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, max) : [];
  } catch {
    return [];
  }
};

export function mapProfile(map: Map<string, string>) {
  if (map.size === 0) return null;
  const years = Number.parseFloat(map.get('yearsExperience') ?? '');
  return {
    name: (map.get('name') ?? '').slice(0, 200),
    headline: (map.get('headline') ?? '').slice(0, 300),
    location: (map.get('location') ?? '').slice(0, 200),
    skills: parseList(map.get('skills'), 80),
    titles: parseList(map.get('titles'), 30),
    education: parseList(map.get('education'), 10),
    target_roles: parseList(map.get('targetRoles'), 15),
    preferred_locations: parseList(map.get('preferredLocations'), 15),
    keywords: parseList(map.get('keywords'), 40),
    exclude_keywords: parseList(map.get('excludeKeywords'), 40),
    years_experience: Number.isFinite(years) && years >= 0 && years <= 60 ? Math.round(years * 10) / 10 : null,
    parsed_at: wallToTimestamptz(map.get('parsedAt')),
  };
}

export function mapSettings(map: Map<string, string>) {
  const count = (key: string, fallback: number, max: number) => {
    const n = Number.parseInt(map.get(key) ?? '', 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : fallback;
  };
  return {
    weekly_applications: count('weeklyApplicationsTarget', 5, 100),
    weekly_interviews: count('weeklyInterviewsTarget', 2, 50),
  };
}
