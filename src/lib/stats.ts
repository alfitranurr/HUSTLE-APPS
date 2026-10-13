import { FIRST_INTERVIEW_STAGE, JOB_STAGES, type JobStage } from './constants';
import { addDays, parseDate, percent, startOfDay } from './format';
import type { Job } from './types';

export function stageIndex(stage: JobStage): number {
  return JOB_STAGES.indexOf(stage);
}

const INTERVIEW_INDEX = stageIndex(FIRST_INTERVIEW_STAGE);

/** True once an application has reached HR interview or any later stage. */
export function reachedInterview(job: Job): boolean {
  return stageIndex(job.stage) >= INTERVIEW_INDEX;
}

export function isActive(job: Job): boolean {
  return job.status === 'Not Started' || job.status === 'In Progress';
}

/**
 * Groups behind the headline numbers. The stat cards, the drill-down lists
 * and the Applications "Group" filter all use these predicates, so a number
 * and the list of companies behind it can never disagree.
 */
export const SEGMENTS = {
  all: { label: 'All applications', match: () => true },
  active: { label: 'Active applications', match: isActive },
  interviews: { label: 'Reached an interview', match: reachedInterview },
  offers: { label: 'Offers', match: (job: Job) => job.status === 'Success' },
  rejected: { label: 'Rejected', match: (job: Job) => job.status === 'Failed' },
} as const satisfies Record<string, { label: string; match: (job: Job) => boolean }>;

export type Segment = keyof typeof SEGMENTS;

export function isSegment(value: unknown): value is Segment {
  return typeof value === 'string' && value in SEGMENTS;
}

export interface JobStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejected: number;
  interviewRate: number;
  offerRate: number;
}

export function computeJobStats(jobs: Job[]): JobStats {
  const total = jobs.length;
  const active = jobs.filter(SEGMENTS.active.match).length;
  const interviews = jobs.filter(SEGMENTS.interviews.match).length;
  const offers = jobs.filter(SEGMENTS.offers.match).length;
  const rejected = jobs.filter(SEGMENTS.rejected.match).length;
  return {
    total,
    active,
    interviews,
    offers,
    rejected,
    interviewRate: percent(interviews, total),
    offerRate: percent(offers, total),
  };
}

export interface CountItem {
  name: string;
  value: number;
}

/** Counts jobs by a derived key, most frequent first. Empty keys are skipped. */
export function countBy(jobs: Job[], key: (job: Job) => string, limit?: number): CountItem[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const name = key(job).trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const sorted = [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return limit ? sorted.slice(0, limit) : sorted;
}

export type Timeframe = '7d' | '30d' | 'all';

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export function filterByTimeframe(jobs: Job[], timeframe: Timeframe, now = new Date()): Job[] {
  if (timeframe === 'all') return jobs;
  const from = addDays(startOfDay(now), timeframe === '7d' ? -6 : -29);
  return jobs.filter((job) => {
    const applied = parseDate(job.appliedAt);
    return applied !== null && applied >= from;
  });
}

export interface TimelinePoint {
  name: string;
  Applications: number;
  Interviews: number;
}

/** Applications (by applied date) vs interviews (by schedule, else applied date) per month. */
export function monthlyTimeline(jobs: Job[], months = 12, now = new Date()): TimelinePoint[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      point: {
        name: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        Applications: 0,
        Interviews: 0,
      },
    };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b.point]));
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  for (const job of jobs) {
    const applied = parseDate(job.appliedAt);
    if (applied) {
      const bucket = byKey.get(keyOf(applied));
      if (bucket) bucket.Applications += 1;
    }
    if (reachedInterview(job)) {
      const when = parseDate(job.scheduledAt) ?? applied;
      const bucket = when && byKey.get(keyOf(when));
      if (bucket) bucket.Interviews += 1;
    }
  }
  return buckets.map((b) => b.point);
}
