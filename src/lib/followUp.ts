import { FOLLOW_UP_AFTER_DAYS, STALE_AFTER_DAYS } from './constants';
import { daysBetween, parseDate } from './format';
import type { Job } from './types';

/** Days since the application last changed, or null if unknown. */
export function daysSinceUpdate(job: Job, now = new Date()): number | null {
  const last = parseDate(job.updatedAt) ?? parseDate(job.appliedAt);
  return last ? daysBetween(last, now) : null;
}

/**
 * An in-progress application with no update for FOLLOW_UP_AFTER_DAYS and no
 * upcoming scheduled step is probably waiting on you to nudge the recruiter.
 */
export function needsFollowUp(job: Job, now = new Date()): boolean {
  if (job.status !== 'In Progress') return false;
  const scheduled = parseDate(job.scheduledAt);
  if (scheduled && scheduled >= now) return false;
  const days = daysSinceUpdate(job, now);
  return days !== null && days >= FOLLOW_UP_AFTER_DAYS;
}

/**
 * Open (not started / in progress) application with no update for
 * STALE_AFTER_DAYS and nothing scheduled ahead: realistically no response.
 */
export function isStale(job: Job, now = new Date()): boolean {
  if (job.status !== 'Not Started' && job.status !== 'In Progress') return false;
  const scheduled = parseDate(job.scheduledAt);
  if (scheduled && scheduled >= now) return false;
  const days = daysSinceUpdate(job, now);
  return days !== null && days >= STALE_AFTER_DAYS;
}

/** Stalest first. */
export function followUpQueue(jobs: Job[], now = new Date()): { job: Job; days: number }[] {
  return jobs
    .filter((job) => needsFollowUp(job, now))
    .map((job) => ({ job, days: daysSinceUpdate(job, now) ?? 0 }))
    .sort((a, b) => b.days - a.days);
}
