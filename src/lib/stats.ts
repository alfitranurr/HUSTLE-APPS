import { FIRST_INTERVIEW_STAGE, JOB_STAGES, STAGE_SHORT_LABEL, type JobStage } from './constants';
import { addDays, parseDate, percent, startOfDay, toDateKey } from './format';
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
  noResponse: { label: 'No response', match: (job: Job) => job.status === 'No Response' },
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
  noResponse: number;
  interviewRate: number;
  offerRate: number;
}

export function computeJobStats(jobs: Job[]): JobStats {
  const total = jobs.length;
  const active = jobs.filter(SEGMENTS.active.match).length;
  const interviews = jobs.filter(SEGMENTS.interviews.match).length;
  const offers = jobs.filter(SEGMENTS.offers.match).length;
  const rejected = jobs.filter(SEGMENTS.rejected.match).length;
  const noResponse = jobs.filter(SEGMENTS.noResponse.match).length;
  return {
    total,
    active,
    interviews,
    offers,
    rejected,
    noResponse,
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

/** First day included in a timeframe (applied date), or null for all time. */
export function timeframeStart(timeframe: Timeframe, now = new Date()): Date | null {
  return timeframe === 'all' ? null : addDays(startOfDay(now), timeframe === '7d' ? -6 : -29);
}

export function filterByTimeframe(jobs: Job[], timeframe: Timeframe, now = new Date()): Job[] {
  const from = timeframeStart(timeframe, now);
  if (!from) return jobs;
  return jobs.filter((job) => {
    const applied = parseDate(job.appliedAt);
    return applied !== null && applied >= from;
  });
}

export interface TimelinePoint {
  name: string;
  /** First and last day of the month (yyyy-mm-dd), for drill-down. */
  from: string;
  to: string;
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
        from: toDateKey(date),
        to: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
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

// --- Insights analytics -------------------------------------------------------------

export interface FunnelStep {
  stage: JobStage;
  label: string;
  /** Applications that reached this stage or any later one. */
  reached: number;
  /** Share of the previous step that made it here (null for the first step). */
  fromPrevious: number | null;
  ofTotal: number;
}

/** How far applications got: "reached at least this stage", in pipeline order. */
export function pipelineFunnel(jobs: Job[]): FunnelStep[] {
  const total = jobs.length;
  let previous = total;
  return JOB_STAGES.map((stage, i) => {
    const reached = jobs.filter((job) => stageIndex(job.stage) >= i).length;
    const step: FunnelStep = {
      stage,
      label: STAGE_SHORT_LABEL[stage],
      reached,
      fromPrevious: i === 0 ? null : percent(reached, previous),
      ofTotal: percent(reached, total),
    };
    previous = reached;
    return step;
  });
}

/** The step with the lowest pass rate, ignoring tiny bases that would just be noise. */
export function biggestDrop(steps: FunnelStep[], minBase = 5): { from: FunnelStep; to: FunnelStep } | null {
  let worst: { from: FunnelStep; to: FunnelStep } | null = null;
  for (let i = 1; i < steps.length; i++) {
    const from = steps[i - 1];
    const to = steps[i];
    if (from.reached < minBase || to.fromPrevious === null) continue;
    if (!worst || to.fromPrevious < (worst.to.fromPrevious ?? 100)) worst = { from, to };
  }
  return worst;
}

export interface RejectionPoint {
  stage: JobStage;
  label: string;
  rejected: number;
  /** Applications that reached this stage at all. */
  reached: number;
  /** Rejected here as a share of those who reached it. */
  rate: number;
}

/** Where rejections happen, in pipeline order (stages with at least one rejection). */
export function rejectionPoints(jobs: Job[]): RejectionPoint[] {
  return JOB_STAGES.map((stage, i) => {
    const rejected = jobs.filter((job) => job.status === 'Failed' && job.stage === stage).length;
    const reached = jobs.filter((job) => stageIndex(job.stage) >= i).length;
    return { stage, label: STAGE_SHORT_LABEL[stage], rejected, reached, rate: percent(rejected, reached) };
  }).filter((point) => point.rejected > 0);
}

export interface PositionStat {
  position: string;
  applications: number;
  interviewed: number;
  offers: number;
  rejected: number;
  interviewRate: number;
}

/** Conversion per position for roles with enough applications to compare. */
export function positionStats(jobs: Job[], minApplications = 3): PositionStat[] {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = job.position.trim();
    if (!key) continue;
    const match = [...groups.keys()].find((k) => k.toLowerCase() === key.toLowerCase()) ?? key;
    groups.set(match, [...(groups.get(match) ?? []), job]);
  }
  return [...groups]
    .filter(([, list]) => list.length >= minApplications)
    .map(([position, list]) => {
      const interviewed = list.filter(reachedInterview).length;
      return {
        position,
        applications: list.length,
        interviewed,
        offers: list.filter((job) => job.status === 'Success').length,
        rejected: list.filter((job) => job.status === 'Failed').length,
        interviewRate: percent(interviewed, list.length),
      };
    })
    .sort((a, b) => b.applications - a.applications);
}

/** How many applications have a value for a field (to qualify breakdowns built on sparse data). */
export function coverage(jobs: Job[], pick: (job: Job) => string, ignore: string[] = []): number {
  return jobs.filter((job) => {
    const value = pick(job).trim();
    return value && !ignore.includes(value);
  }).length;
}
