import 'server-only';
import { DEFAULT_WEEKLY_TARGETS } from '@/lib/constants';
import type { WeeklyTargets } from '@/lib/types';
import { must, owned, type DataContext } from '../db';

/** Weekly targets in user_settings (one row per user, created at sign-up). */

export async function getWeeklyTargets(ctx: DataContext): Promise<WeeklyTargets> {
  const row = must(
    await ctx.db
      .from('user_settings')
      .select('weekly_applications, weekly_interviews')
      .eq('user_id', ctx.userId)
      .maybeSingle()
  ) as { weekly_applications: number; weekly_interviews: number } | null;
  return row
    ? { applications: row.weekly_applications, interviews: row.weekly_interviews }
    : { ...DEFAULT_WEEKLY_TARGETS };
}

export async function setWeeklyTargets(ctx: DataContext, targets: WeeklyTargets): Promise<WeeklyTargets> {
  must(
    await ctx.db
      .from('user_settings')
      .upsert(
        owned(ctx, { weekly_applications: targets.applications, weekly_interviews: targets.interviews }),
        { onConflict: 'user_id' }
      )
  );
  return targets;
}
