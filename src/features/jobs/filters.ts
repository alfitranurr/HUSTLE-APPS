import { JOB_STAGES, JOB_STATUSES } from '@/lib/constants';
import { needsFollowUp } from '@/lib/followUp';
import { parseDate } from '@/lib/format';
import { SEGMENTS, type Segment } from '@/lib/stats';
import type { Job } from '@/lib/types';

export interface JobFilters {
  search: string;
  status: string;
  stage: string;
  careerLevel: string;
  province: string;
  position: string;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  followUp: '' | 'yes';
  /** Headline group (active, interviews, offers, rejected); '' = any. */
  segment: '' | Segment;
}

export const EMPTY_FILTERS: JobFilters = {
  search: '',
  status: '',
  stage: '',
  careerLevel: '',
  province: '',
  position: '',
  from: '',
  to: '',
  followUp: '',
  segment: '',
};

export function activeFilterCount(filters: JobFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function filterJobs(jobs: Job[], f: JobFilters, now = new Date()): Job[] {
  const query = f.search.trim().toLowerCase();
  const from = f.from ? new Date(`${f.from}T00:00:00`) : null;
  const to = f.to ? new Date(`${f.to}T23:59:59`) : null;

  return jobs.filter((job) => {
    if (query) {
      const haystack = [job.company, job.position, job.note, job.city, job.province, job.platform].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (f.followUp && !needsFollowUp(job, now)) return false;
    if (f.segment && !SEGMENTS[f.segment].match(job)) return false;
    if (f.status && job.status !== f.status) return false;
    if (f.stage && job.stage !== f.stage) return false;
    if (f.careerLevel && !same(job.careerLevel, f.careerLevel)) return false;
    if (f.province && !same(job.province, f.province)) return false;
    if (f.position && !same(job.position, f.position)) return false;
    if (from || to) {
      const applied = parseDate(job.appliedAt);
      if (!applied || (from && applied < from) || (to && applied > to)) return false;
    }
    return true;
  });
}

export type SortKey = 'appliedAt' | 'company' | 'status' | 'stage';
export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export const DEFAULT_SORT: SortState = { key: 'appliedAt', direction: 'desc' };

export function sortJobs(jobs: Job[], { key, direction }: SortState): Job[] {
  const factor = direction === 'asc' ? 1 : -1;
  const value = (job: Job): number | string => {
    switch (key) {
      case 'appliedAt':
        return parseDate(job.appliedAt)?.getTime() ?? 0;
      case 'status':
        return JOB_STATUSES.indexOf(job.status);
      case 'stage':
        return JOB_STAGES.indexOf(job.stage);
      default:
        return job.company.toLowerCase();
    }
  };
  return [...jobs].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * factor;
  });
}

/** Distinct non-empty values for a field, alphabetically. */
export function distinct(jobs: Job[], pick: (job: Job) => string): string[] {
  return [...new Set(jobs.map(pick).map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
