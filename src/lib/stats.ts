import { INTERVIEW_STAGES, JOB_STAGES, STAGE_SHORT_LABEL, type JobStage, type JobStatus } from './constants';
import { addDays, parseDate, percent, startOfDay, toDateKey } from './format';
import type { Job } from './types';

export function stageIndex(stage: JobStage): number {
  return JOB_STAGES.indexOf(stage);
}

/**
 * Did this application go through `stage`? Only with evidence: it is at that
 * stage now, or a date was recorded for it. Hiring processes skip steps, so
 * being further along proves nothing about the steps in between. Every
 * application counts as applied ("Not Started").
 */
export function reachedStage(job: Job, stage: JobStage): boolean {
  if (stage === JOB_STAGES[0]) return true;
  return job.stage === stage || Boolean(job.stageDates[stage]);
}

/** True once an application has been through an HR, user or FGD/LGD interview (same evidence rule). */
export function reachedInterview(job: Job): boolean {
  return INTERVIEW_STAGES.some((stage) => reachedStage(job, stage));
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

// Fixed three-letter names (some locales print "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        name: `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`,
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
  /** Applications that went through this stage (see reachedStage). */
  reached: number;
  /** Share of all applications. Steps can be skipped, so a step-to-step rate would mislead. */
  ofTotal: number;
}

/** How many applications went through each stage, in pipeline order. */
export function pipelineFunnel(jobs: Job[]): FunnelStep[] {
  const total = jobs.length;
  return JOB_STAGES.map((stage) => {
    const reached = jobs.filter((job) => reachedStage(job, stage)).length;
    return { stage, label: STAGE_SHORT_LABEL[stage], reached, ofTotal: percent(reached, total) };
  });
}

export interface StopPoint {
  stage: JobStage;
  label: string;
  /** Applications whose latest stage is this one. */
  count: number;
  /** Share of all applications. */
  share: number;
}

/**
 * Where applications most often end up: the stage (after applying, before
 * signing) that is the latest one for the most applications. Ignored when too
 * few applications sit there to mean anything.
 */
export function mostCommonStop(jobs: Job[], minCount = 5): StopPoint | null {
  let best: StopPoint | null = null;
  for (const stage of JOB_STAGES.slice(1, -1)) {
    const count = jobs.filter((job) => job.stage === stage).length;
    if (count >= minCount && (!best || count > best.count)) {
      best = { stage, label: STAGE_SHORT_LABEL[stage], count, share: percent(count, jobs.length) };
    }
  }
  return best;
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
  return JOB_STAGES.map((stage) => {
    const rejected = jobs.filter((job) => job.status === 'Failed' && job.stage === stage).length;
    const reached = jobs.filter((job) => reachedStage(job, stage)).length;
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

export interface CompanyStat {
  company: string;
  applications: number;
  /** Furthest stage reached across this company's applications, and that application's status. */
  furthest: JobStage;
  status: JobStatus;
}

/** One row per company (case-insensitive), furthest progress first, then most applications. */
export function companyStats(jobs: Job[]): CompanyStat[] {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const name = job.company.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), job]);
  }
  return [...groups.values()]
    .map((list) => {
      const best = list.reduce((a, b) => (stageIndex(b.stage) > stageIndex(a.stage) ? b : a));
      return { company: list[0].company.trim(), applications: list.length, furthest: best.stage, status: best.status };
    })
    .sort(
      (a, b) =>
        stageIndex(b.furthest) - stageIndex(a.furthest) ||
        b.applications - a.applications ||
        a.company.localeCompare(b.company)
    );
}

/** How many applications have a value for a field (to qualify breakdowns built on sparse data). */
export function coverage(jobs: Job[], pick: (job: Job) => string, ignore: string[] = []): number {
  return jobs.filter((job) => {
    const value = pick(job).trim();
    return value && !ignore.includes(value);
  }).length;
}
