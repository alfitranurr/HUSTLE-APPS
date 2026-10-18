import 'server-only';
import type { CandidateProfile, ProfileInput } from '@/lib/types';
import { ensureSheet, readValues, writeValues } from '../google/sheet';

/** Key/value rows in a "Profile" tab; list fields are stored as JSON arrays. */
const SHEET = 'Profile';
const LIST_KEYS = ['skills', 'titles', 'education', 'targetRoles', 'preferredLocations', 'keywords', 'excludeKeywords'] as const;
const TEXT_KEYS = ['name', 'headline', 'location', 'parsedAt'] as const;

const parseList = (value: string | undefined): string[] => {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

export async function getProfile(): Promise<CandidateProfile | null> {
  await ensureSheet(SHEET, ['Key', 'Value']);
  const rows = await readValues(`${SHEET}!A2:B`);
  if (rows.length === 0) return null;
  const map = new Map(rows.filter(([key]) => key).map(([key, value]) => [key, value ?? '']));
  const years = Number.parseFloat(map.get('yearsExperience') ?? '');
  return {
    ...(Object.fromEntries(TEXT_KEYS.map((k) => [k, map.get(k) ?? ''])) as Record<(typeof TEXT_KEYS)[number], string>),
    ...(Object.fromEntries(LIST_KEYS.map((k) => [k, parseList(map.get(k))])) as Record<(typeof LIST_KEYS)[number], string[]>),
    yearsExperience: Number.isFinite(years) ? years : null,
  };
}

export async function saveProfile(input: ProfileInput, parsedAt?: string): Promise<CandidateProfile> {
  const current = await getProfile();
  const profile: CandidateProfile = { ...input, parsedAt: parsedAt ?? current?.parsedAt ?? '' };
  const rows: string[][] = [
    ...TEXT_KEYS.map((k) => [k, profile[k]]),
    ...LIST_KEYS.map((k) => [k, JSON.stringify(profile[k])]),
    ['yearsExperience', profile.yearsExperience === null ? '' : String(profile.yearsExperience)],
  ];
  await ensureSheet(SHEET, ['Key', 'Value']);
  await writeValues(`${SHEET}!A2:B${rows.length + 1}`, rows);
  return profile;
}
