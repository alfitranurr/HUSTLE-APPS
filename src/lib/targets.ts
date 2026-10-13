import { addDays, parseDate, startOfWeek, toDateKey } from './format';
import { reachedInterview } from './stats';
import type { Job, WeeklyTargets } from './types';

export interface WeeklyProgress {
  applications: number;
  interviews: number;
  /** Consecutive weeks (Mon–Sun) meeting the application target. */
  streak: number;
  weekStart: Date;
}

/**
 * Applications are counted by applied date. Interviews are applications at an
 * interview stage (or later) whose scheduled date falls in the week.
 */
export function weeklyProgress(jobs: Job[], targets: WeeklyTargets, now = new Date()): WeeklyProgress {
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const appsPerWeek = new Map<string, number>();
  let applications = 0;
  let interviews = 0;

  for (const job of jobs) {
    const applied = parseDate(job.appliedAt);
    if (applied) {
      const key = toDateKey(startOfWeek(applied));
      appsPerWeek.set(key, (appsPerWeek.get(key) ?? 0) + 1);
      if (applied >= weekStart && applied < weekEnd) applications += 1;
    }
    const scheduled = parseDate(job.scheduledAt);
    if (scheduled && scheduled >= weekStart && scheduled < weekEnd && reachedInterview(job)) interviews += 1;
  }

  return { applications, interviews, streak: computeStreak(appsPerWeek, targets.applications, weekStart), weekStart };
}

function computeStreak(appsPerWeek: Map<string, number>, target: number, currentWeek: Date): number {
  if (target <= 0) return 0;
  const met = (week: Date) => (appsPerWeek.get(toDateKey(week)) ?? 0) >= target;
  // The current week still counts as "in progress": it extends the streak once met but never breaks it.
  let week = met(currentWeek) ? currentWeek : addDays(currentWeek, -7);
  let streak = 0;
  while (met(week) && streak < 520) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}
