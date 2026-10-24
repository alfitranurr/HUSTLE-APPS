import { STAGE_SHORT_LABEL, STATUS_TONE, type JobStage, type JobStatus } from '@/lib/constants';
import { parseDate } from '@/lib/format';
import { reachedStage, SEGMENTS, type Segment } from '@/lib/stats';
import type { Tone } from '@/lib/tones';
import type { Job } from '@/lib/types';
import type { JobFilters } from './filters';

/**
 * A group of applications behind a number on a card: what the drill-down dialog
 * lists, and which Applications filters reproduce it ("Open in Applications").
 */
export interface JobSelection {
  title: string;
  tone: Tone;
  match: (job: Job) => boolean;
  /** Applications filters for the deep link; omitted when the page cannot express the group. */
  filters?: Partial<JobFilters>;
}

const SEGMENT_TONE: Record<Segment, Tone> = {
  all: 'indigo',
  active: 'sky',
  interviews: 'violet',
  offers: 'emerald',
  rejected: 'rose',
  noResponse: 'slate',
};

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const selectSegment = (segment: Segment): JobSelection => ({
  title: SEGMENTS[segment].label,
  tone: SEGMENT_TONE[segment],
  match: SEGMENTS[segment].match,
  filters: segment === 'all' ? {} : { segment },
});

export const selectStatus = (status: JobStatus): JobSelection => ({
  title: `Status: ${status}`,
  tone: STATUS_TONE[status],
  match: (job) => job.status === status,
  filters: { status },
});

export const selectRejectedAt = (stage: JobStage): JobSelection => ({
  title: `Rejected at ${STAGE_SHORT_LABEL[stage]}`,
  tone: 'rose',
  match: (job) => job.status === 'Failed' && job.stage === stage,
  filters: { segment: 'rejected', stage },
});

/** Went through this stage (the funnel's definition: at it now, or a date recorded for it). */
export const selectReached = (stage: JobStage): JobSelection => ({
  title: `Went through ${STAGE_SHORT_LABEL[stage]}`,
  tone: 'indigo',
  match: (job) => reachedStage(job, stage),
});

export const selectPosition = (position: string, tone: Tone = 'indigo'): JobSelection => ({
  title: position,
  tone,
  match: (job) => same(job.position, position),
  filters: { position },
});

export const selectCompany = (company: string): JobSelection => ({
  title: company,
  tone: 'indigo',
  match: (job) => same(job.company, company),
  filters: { search: company },
});

/** Applications whose applied date falls in [from, to] (yyyy-mm-dd). */
export const selectApplied = (label: string, from: string, to: string): JobSelection => ({
  title: `Applied in ${label}`,
  tone: 'emerald',
  match: (job) => {
    const applied = parseDate(job.appliedAt);
    return Boolean(applied && applied >= new Date(`${from}T00:00:00`) && applied <= new Date(`${to}T23:59:59`));
  },
  filters: { from, to },
});

export function selectionHref(selection: JobSelection): string | null {
  if (!selection.filters) return null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selection.filters)) if (value) params.set(key, String(value));
  return params.size ? `/tracker?${params}` : '/tracker';
}
