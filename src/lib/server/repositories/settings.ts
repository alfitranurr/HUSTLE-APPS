import 'server-only';
import { DEFAULT_WEEKLY_TARGETS } from '@/lib/constants';
import type { WeeklyTargets } from '@/lib/types';
import { ensureSheet, readValues, writeValues } from '../google/sheet';

/** Key/value settings stored in a "Settings" tab (column A = key, B = value). */
const SHEET = 'Settings';
const KEYS = { applications: 'weeklyApplicationsTarget', interviews: 'weeklyInterviewsTarget' } as const;

async function readMap(): Promise<Map<string, string>> {
  await ensureSheet(SHEET, ['Key', 'Value']);
  const rows = await readValues(`${SHEET}!A2:B`);
  return new Map(rows.filter(([key]) => key).map(([key, value]) => [key, value ?? '']));
}

const toCount = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export async function getWeeklyTargets(): Promise<WeeklyTargets> {
  const map = await readMap();
  return {
    applications: toCount(map.get(KEYS.applications), DEFAULT_WEEKLY_TARGETS.applications),
    interviews: toCount(map.get(KEYS.interviews), DEFAULT_WEEKLY_TARGETS.interviews),
  };
}

export async function setWeeklyTargets(targets: WeeklyTargets): Promise<WeeklyTargets> {
  const map = await readMap();
  map.set(KEYS.applications, String(targets.applications));
  map.set(KEYS.interviews, String(targets.interviews));
  // Rewrite the whole (tiny) table so keys stay unique.
  await writeValues(`${SHEET}!A2:B${map.size + 1}`, [...map].map(([k, v]) => [k, v]));
  return targets;
}
