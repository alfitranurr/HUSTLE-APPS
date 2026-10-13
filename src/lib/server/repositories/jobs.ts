import 'server-only';
import { JOB_STAGES, JOB_STATUSES, type JobStage, type JobStatus } from '@/lib/constants';
import type { Job } from '@/lib/types';
import { advanceStageDates, parseStageDates, serializeStageDates } from '@/lib/stageDates';
import { splitAttachmentCell } from '@/lib/urls';
import { appendRow, columnLetter, deleteRow, ensureSheet, NotFoundError, readValues, writeValues } from '../google/sheet';

const SHEET = 'DataLowongan';

/** Physical column order in the sheet (kept compatible with the original Apps Script layout). */
const COLUMNS = [
  'ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web', 'Kategori',
  'Note', 'BuktiURL', 'Platform', 'CareerLevel', 'CurrentStage', 'Province', 'City', 'OtherLink', 'LastUpdated',
  'ContractDate', 'StageDates',
] as const;
type Column = (typeof COLUMNS)[number];

const LAST_COLUMN = columnLetter(COLUMNS.length);
const headerKey = (h: string) => h.replace(/\s+/g, '').toLowerCase();

/** Fields the user edits. Everything except identity and bookkeeping timestamps. */
export type JobData = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;

interface StoredJob {
  job: Job;
  row: number;
}

// --- normalisation of legacy values -------------------------------------------

function normalizeStatus(raw: string): JobStatus {
  const s = raw.toLowerCase();
  const exact = JOB_STATUSES.find((status) => status.toLowerCase() === s);
  if (exact) return exact;
  if (s === 'done' || s.includes('success')) return 'Success';
  if (s.includes('fail') || s.includes('declin') || s.includes('reject')) return 'Failed';
  if (s === 'progress' || s.includes('progress') || s.includes('psikotes') || s.includes('interview')) {
    return 'In Progress';
  }
  return 'Not Started';
}

function normalizeStage(raw: string): JobStage {
  const s = raw.toLowerCase();
  const exact = JOB_STAGES.find((stage) => stage.toLowerCase() === s);
  if (exact) return exact;
  if (['online test', 'technical test', 'psikotes'].includes(s)) return 'Assessment Test';
  if (s === 'presentation round') return 'FGD/LGD';
  return 'Not Started';
}

// --- row <-> Job mapping ------------------------------------------------------------

function toJob(get: (column: Column) => string): Job {
  return {
    id: get('ID'),
    company: get('Company'),
    position: get('Kategori'),
    // Older rows have no application date; the creation timestamp is the best approximation.
    appliedAt: get('StartDate') || get('Timestamp'),
    scheduledAt: get('EndDate'),
    contractDate: get('ContractDate'),
    stageDates: parseStageDates(get('StageDates')),
    status: normalizeStatus(get('Status')),
    stage: normalizeStage(get('CurrentStage')),
    platform: get('Platform'),
    careerLevel: get('CareerLevel'),
    province: get('Province'),
    city: get('City'),
    note: get('Note'),
    links: {
      instagram: get('Instagram'),
      linkedin: get('LinkedIn'),
      website: get('Web'),
      other: get('OtherLink'),
    },
    attachments: splitAttachmentCell(get('BuktiURL')),
    createdAt: get('Timestamp'),
    updatedAt: get('LastUpdated') || get('Timestamp'),
  };
}

function toCells(job: Job): string[] {
  const values: Record<Column, string> = {
    ID: job.id,
    Timestamp: job.createdAt,
    Company: job.company,
    StartDate: job.appliedAt,
    EndDate: job.scheduledAt,
    Status: job.status,
    Instagram: job.links.instagram,
    LinkedIn: job.links.linkedin,
    Web: job.links.website,
    Kategori: job.position,
    Note: job.note,
    BuktiURL: job.attachments.length ? job.attachments.join(', ') : 'No File',
    Platform: job.platform,
    CareerLevel: job.careerLevel,
    CurrentStage: job.stage,
    Province: job.province,
    City: job.city,
    OtherLink: job.links.other,
    LastUpdated: job.updatedAt,
    ContractDate: job.contractDate,
    StageDates: serializeStageDates(job.stageDates),
  };
  return COLUMNS.map((column) => values[column]);
}

// --- reads ----------------------------------------------------------------------

let headerChecked = false;

async function readAll(): Promise<StoredJob[]> {
  await ensureSheet(SHEET, COLUMNS);
  const values = await readValues(`${SHEET}!A:${LAST_COLUMN}`);
  if (values.length === 0) return [];

  // Columns are located by header name, falling back to the canonical position.
  const header = values[0].map(headerKey);
  const indexOf = (column: Column) => {
    const aliases = column === 'OtherLink' ? ['otherlink', 'linkother'] : [headerKey(column)];
    const found = header.findIndex((h) => aliases.includes(h));
    return found >= 0 ? found : COLUMNS.indexOf(column);
  };
  const index = new Map(COLUMNS.map((c) => [c, indexOf(c)]));

  // Columns added after the original layout (LastUpdated, ContractDate, StageDates) get their header once.
  if (!headerChecked) {
    headerChecked = true;
    const missing = COLUMNS.map((name, i) => ({ name, i })).filter(({ i }) => !header[i]);
    for (const { name, i } of missing) await writeValues(`${SHEET}!${columnLetter(i + 1)}1`, [[name]]);
  }

  const stored = values
    .slice(1)
    .map((cells, i) => ({ job: toJob((c) => cells[index.get(c)!] ?? ''), row: i + 2 }))
    .filter(({ job }) => job.company);

  await backfillMissingIds(stored);
  return stored;
}

/** Legacy rows without an ID can't be addressed safely, so give them one once. */
async function backfillMissingIds(stored: StoredJob[]) {
  const missing = stored.filter(({ job }) => !job.id);
  for (const [i, entry] of missing.entries()) {
    entry.job.id = `ID-${Date.now()}-${i}`;
    await writeValues(`${SHEET}!A${entry.row}`, [[entry.job.id]]);
  }
}

async function find(id: string): Promise<StoredJob> {
  const found = (await readAll()).find((entry) => entry.job.id === id);
  if (!found) throw new NotFoundError('Application not found');
  return found;
}

export async function listJobs(): Promise<Job[]> {
  return (await readAll()).map(({ job }) => job);
}

export async function getJob(id: string): Promise<Job> {
  return (await find(id)).job;
}

// --- writes ---------------------------------------------------------------------

async function writeJob(row: number, job: Job) {
  await writeValues(`${SHEET}!A${row}:${LAST_COLUMN}${row}`, [toCells(job)]);
}

export async function createJob(data: JobData): Promise<Job> {
  await ensureSheet(SHEET, COLUMNS);
  const now = new Date().toISOString();
  const job: Job = {
    ...data,
    stageDates: advanceStageDates(data.stageDates, data.stage),
    id: `ID-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  await appendRow(`${SHEET}!A:${LAST_COLUMN}`, toCells(job));
  return job;
}

export async function updateJob(id: string, data: JobData): Promise<{ before: Job; after: Job }> {
  const { job: before, row } = await find(id);
  const after: Job = {
    ...data,
    stageDates: advanceStageDates(data.stageDates, data.stage, before.stage),
    id,
    createdAt: before.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await writeJob(row, after);
  return { before, after };
}

export type JobPatch = Partial<Pick<Job, 'stage' | 'status'>>;

/** Small updates (stage change from the board, "followed up"). Always bumps `updatedAt`. */
export async function patchJob(id: string, patch: JobPatch): Promise<Job> {
  const { job, row } = await find(id);
  const stage = patch.stage ?? job.stage;
  const after: Job = {
    ...job,
    ...patch,
    stageDates: advanceStageDates(job.stageDates, stage, job.stage),
    updatedAt: new Date().toISOString(),
  };
  await writeJob(row, after);
  return after;
}

export async function deleteJob(id: string): Promise<Job> {
  const { job, row } = await find(id);
  await deleteRow(SHEET, row);
  return job;
}
