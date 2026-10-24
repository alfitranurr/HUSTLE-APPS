import 'server-only';
import type { CandidateProfile, ProfileInput } from '@/lib/types';
import { must, owned, type DataContext } from '../db';

/** One candidate_profiles row per user (Job match). */

interface ProfileRow {
  name: string;
  headline: string;
  location: string;
  skills: string[];
  titles: string[];
  education: string[];
  target_roles: string[];
  preferred_locations: string[];
  keywords: string[];
  exclude_keywords: string[];
  years_experience: number | string | null;
  parsed_at: string | null;
}

const SELECT =
  'name, headline, location, skills, titles, education, target_roles, preferred_locations, keywords, exclude_keywords, years_experience, parsed_at';

function toProfile(row: ProfileRow): CandidateProfile {
  // numeric comes back as a string from PostgREST.
  const years = row.years_experience === null ? null : Number(row.years_experience);
  return {
    name: row.name,
    headline: row.headline,
    location: row.location,
    skills: row.skills,
    titles: row.titles,
    education: row.education,
    targetRoles: row.target_roles,
    preferredLocations: row.preferred_locations,
    keywords: row.keywords,
    excludeKeywords: row.exclude_keywords,
    yearsExperience: years !== null && Number.isFinite(years) ? years : null,
    parsedAt: row.parsed_at ? new Date(row.parsed_at).toISOString() : '',
  };
}

export async function getProfile(ctx: DataContext): Promise<CandidateProfile | null> {
  const row = must(
    await ctx.db.from('candidate_profiles').select(SELECT).eq('user_id', ctx.userId).maybeSingle()
  ) as ProfileRow | null;
  return row ? toProfile(row) : null;
}

/** Saves the whole profile. `parsedAt` is set only when a PDF was just read. */
export async function saveProfile(ctx: DataContext, input: ProfileInput, parsedAt?: string): Promise<CandidateProfile> {
  const values = {
    name: input.name,
    headline: input.headline,
    location: input.location,
    skills: input.skills,
    titles: input.titles,
    education: input.education,
    target_roles: input.targetRoles,
    preferred_locations: input.preferredLocations,
    keywords: input.keywords,
    exclude_keywords: input.excludeKeywords,
    years_experience: input.yearsExperience,
    ...(parsedAt ? { parsed_at: parsedAt } : {}),
  };
  const row = must(
    await ctx.db.from('candidate_profiles').upsert(owned(ctx, values), { onConflict: 'user_id' }).select(SELECT).single()
  ) as ProfileRow;
  return toProfile(row);
}
