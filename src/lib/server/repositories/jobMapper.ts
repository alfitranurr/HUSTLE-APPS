import { timestamptzToWall, toDateOnly, wallToTimestamptz } from '@/lib/jakartaTime';
import { parseStageDates } from '@/lib/stageDates';
import type { Attachment, Job, JobStage, JobStatus } from '@/lib/types';

/** Pure row <-> Job mapping (no server-only import, so it is unit-testable). */

export interface AttachmentRow {
  id: string;
  file_name: string;
  created_at: string;
}

export interface JobRow {
  id: string;
  company: string;
  position: string;
  applied_at: string;
  scheduled_at: string | null;
  contract_date: string | null;
  stage_dates: unknown;
  status: string;
  stage: string;
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
  job_attachments?: AttachmentRow[] | null;
}

/** Columns read for a job, with its attachments embedded. */
export const JOB_SELECT =
  'id, company, position, applied_at, scheduled_at, contract_date, stage_dates, status, stage, platform, career_level, ' +
  'province, city, note, link_instagram, link_linkedin, link_website, link_other, created_at, updated_at, ' +
  'job_attachments (id, file_name, created_at)';

/** Fields the user edits: everything except identity, bookkeeping timestamps and files. */
export type JobData = Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>;

export const attachmentUrl = (id: string) => `/api/attachments/${id}`;

export function toAttachment(row: AttachmentRow): Attachment {
  return { id: row.id, name: row.file_name, url: attachmentUrl(row.id) };
}

const iso = (value: string) => new Date(value).toISOString();

export function rowToJob(row: JobRow): Job {
  const attachments = [...(row.job_attachments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    appliedAt: timestamptzToWall(row.applied_at),
    scheduledAt: timestamptzToWall(row.scheduled_at),
    contractDate: row.contract_date ?? '',
    stageDates: parseStageDates(row.stage_dates),
    // The database's check constraints only allow known values.
    status: row.status as JobStatus,
    stage: row.stage as JobStage,
    platform: row.platform,
    careerLevel: row.career_level,
    province: row.province,
    city: row.city,
    note: row.note,
    links: {
      instagram: row.link_instagram,
      linkedin: row.link_linkedin,
      website: row.link_website,
      other: row.link_other,
    },
    attachments: attachments.map(toAttachment),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** Editable columns for an insert or a full update. Dates must already be validated. */
export function jobDataToRow(data: JobData) {
  const appliedAt = wallToTimestamptz(data.appliedAt);
  if (!appliedAt) throw new Error('appliedAt must be a valid date');
  return {
    company: data.company,
    position: data.position,
    applied_at: appliedAt,
    scheduled_at: wallToTimestamptz(data.scheduledAt),
    contract_date: toDateOnly(data.contractDate),
    stage_dates: data.stageDates,
    status: data.status,
    stage: data.stage,
    platform: data.platform,
    career_level: data.careerLevel,
    province: data.province,
    city: data.city,
    note: data.note,
    link_instagram: data.links.instagram,
    link_linkedin: data.links.linkedin,
    link_website: data.links.website,
    link_other: data.links.other,
  };
}
