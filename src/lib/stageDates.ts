import { JOB_STAGES, SCHEDULED_STAGES, type JobStage } from './constants';
import type { Job } from './types';

/**
 * Date each pipeline stage was reached (yyyy-mm-dd). The first stage
 * ("Not Started") is represented by the application date, so it is never stored.
 */
export type StageDates = Partial<Record<JobStage, string>>;

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The owner is in Indonesia; "today" for automatic stage dates uses this zone. */
export const APP_TIME_ZONE = 'Asia/Jakarta';

export function todayIso(timeZone = APP_TIME_ZONE): string {
  // en-CA formats as yyyy-mm-dd.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const stageIndex = (stage: JobStage) => JOB_STAGES.indexOf(stage);

/** Tolerant parse of the stored JSON cell; ignores unknown stages and malformed dates. */
export function parseStageDates(raw: unknown): StageDates {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== 'object') return {};
  const result: StageDates = {};
  for (const stage of JOB_STAGES) {
    const date = (value as Record<string, unknown>)[stage];
    if (stage !== 'Not Started' && typeof date === 'string' && ISO_DATE.test(date)) result[stage] = date;
  }
  return result;
}

/** Keeps only stages up to (and including) the current one, in pipeline order. */
export function pruneStageDates(dates: StageDates, current: JobStage): StageDates {
  const result: StageDates = {};
  for (const stage of JOB_STAGES.slice(1, stageIndex(current) + 1)) {
    if (dates[stage]) result[stage] = dates[stage];
  }
  return result;
}

export function serializeStageDates(dates: StageDates): string {
  return Object.keys(dates).length ? JSON.stringify(dates) : '';
}

/**
 * Stage dates after a (possible) stage change: prunes later stages and stamps
 * today on a newly reached stage that has no date yet.
 */
export function advanceStageDates(dates: StageDates, stage: JobStage, previous?: JobStage): StageDates {
  const result = pruneStageDates(dates, stage);
  if (stage !== 'Not Started' && stage !== previous && !result[stage]) result[stage] = todayIso();
  return result;
}

/** Date to display for a stage in the timeline (yyyy-mm-dd or other parseable string), or ''. */
export function displayStageDate(job: Pick<Job, 'appliedAt' | 'scheduledAt' | 'stage' | 'stageDates'>, stage: JobStage): string {
  if (stage === 'Not Started') return job.appliedAt;
  if (job.stageDates[stage]) return job.stageDates[stage]!;
  // A scheduled test/interview that hasn't been dated yet: show its schedule.
  if (stage === job.stage && SCHEDULED_STAGES.includes(stage)) return job.scheduledAt;
  return '';
}
