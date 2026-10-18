import type { CandidateProfile, Job, ParsedJob } from './types';

/**
 * Rule-based match between a recommended job and the owner's profile, 0-100:
 *   role 50 · location 20 · level 15 · skills/keywords 15.
 * Only the title, company and location are known for a recommendation, so the
 * score leans on the title. An exclude keyword sets the score to 0.
 */

export interface MatchResult {
  score: number;
  reasons: string[];
  /** The company + role is already in Applications. */
  alreadyApplied: boolean;
  /** The exclude keyword that zeroed the score, if any. */
  excludedBy: string | null;
}

/** Each group lists phrases that mean the same thing in a job title. */
const SYNONYMS: string[][] = [
  ['data analyst', 'data analytics', 'analytics', 'bi analyst', 'business intelligence analyst', 'reporting analyst', 'insight analyst'],
  ['business analyst', 'business analytics', 'ba'],
  ['data scientist', 'data science', 'machine learning engineer', 'ml engineer'],
  ['data engineer', 'data engineering', 'etl developer', 'analytics engineer'],
  ['ai engineer', 'artificial intelligence engineer', 'machine learning engineer', 'ml engineer'],
  ['management trainee', 'mt', 'graduate trainee', 'officer development program', 'odp', 'leadership development program'],
  ['software engineer', 'software developer', 'programmer', 'developer'],
  ['product analyst', 'product analytics'],
  ['sql', 'mysql', 'postgresql', 'postgres', 'bigquery', 't-sql'],
  ['power bi', 'tableau', 'looker', 'looker studio', 'metabase', 'business intelligence', 'bi'],
  ['excel', 'spreadsheet', 'google sheets'],
  ['python', 'pandas'],
  ['jakarta', 'dki jakarta', 'jabodetabek', 'south jakarta', 'jakarta selatan', 'central jakarta', 'jakarta pusat'],
  ['remote', 'work from home', 'wfh'],
];

const LEVEL_WORDS = new Set([
  'senior', 'sr', 'junior', 'jr', 'lead', 'principal', 'head', 'intern', 'internship', 'staff', 'associate', 'manager',
  'officer', 'specialist', 'executive', 'trainee', 'entry', 'level', 'i', 'ii', 'iii', 'mid',
]);
const STOP_WORDS = new Set(['and', 'or', 'of', 'the', 'for', 'in', 'at', 'to', 'a', 'an', '&', '-', '/', 'with']);

export const normalise = (text: string) =>
  ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, ' ')
    .replace(/\//g, ' ')
    .trim()} `;

const has = (haystack: string, phrase: string) => {
  const p = normalise(phrase);
  return p.trim().length > 0 && haystack.includes(p);
};

/** The phrase plus its synonyms. */
function variants(phrase: string): string[] {
  const p = normalise(phrase).trim();
  const group = SYNONYMS.find((g) => g.includes(p));
  return group ? [p, ...group.filter((g) => g !== p)] : [p];
}

const hasAny = (haystack: string, phrase: string) => variants(phrase).some((v) => has(haystack, v));

const roleTokens = (text: string) =>
  normalise(text)
    .trim()
    .split(' ')
    .filter((t) => t && !STOP_WORDS.has(t) && !LEVEL_WORDS.has(t));

/** 1 when the role (or a synonym) is in the title, else the share of the role's words that appear. */
function roleSimilarity(role: string, title: string): number {
  if (hasAny(normalise(title), role)) return 1;
  const words = roleTokens(role);
  if (words.length === 0) return 0;
  const titleWords = new Set(roleTokens(title));
  return words.filter((w) => titleWords.has(w)).length / words.length;
}

/** 0 intern · 1 entry · 2 mid · 3 senior; null when the title names no level. */
type Level = 0 | 1 | 2 | 3;
const LEVEL_NAME = ['Internship', 'Entry level', 'Mid level', 'Senior'] as const;

function titleLevel(title: string): Level | null {
  const t = normalise(title);
  if (/ (intern|internship|magang|apprentice) /.test(t)) return 0;
  if (/ (senior|sr|lead|principal|head|manager|director|vp|chief) /.test(t)) return 3;
  if (/ (junior|jr|entry|fresh graduate|graduate|trainee|mt|odp) /.test(t)) return 1;
  if (/ (associate|mid|ii|iii) /.test(t)) return 2;
  return null;
}

function candidateLevel(years: number | null): Level | null {
  if (years === null) return null;
  if (years < 1) return 1;
  if (years < 3) return 1;
  if (years < 6) return 2;
  return 3;
}

const sameCompany = (a: string, b: string) => {
  const x = normalise(a).replace(/ (pt|tbk|persero|cv) /g, ' ').trim();
  const y = normalise(b).replace(/ (pt|tbk|persero|cv) /g, ' ').trim();
  return x.length > 0 && (x === y || x.includes(y) || y.includes(x));
};

export function isAlreadyApplied(job: Pick<ParsedJob, 'title' | 'company'>, applications: Job[]): boolean {
  return applications.some(
    (a) => sameCompany(a.company, job.company) && (!a.position || roleSimilarity(a.position, job.title) >= 0.8)
  );
}

export function scoreJob(job: ParsedJob, profile: CandidateProfile | null, applications: Job[] = []): MatchResult {
  const alreadyApplied = isAlreadyApplied(job, applications);
  if (!profile) return { score: 0, reasons: [], alreadyApplied, excludedBy: null };

  const title = normalise(job.title);
  const excludedBy = profile.excludeKeywords.find((k) => has(title, k) || has(normalise(job.company), k)) ?? null;
  if (excludedBy) return { score: 0, reasons: [`Excluded: ${excludedBy}`], alreadyApplied, excludedBy };

  const reasons: string[] = [];

  // Role: target roles count fully, past titles a bit less.
  const roles = [
    ...profile.targetRoles.map((role) => ({ role, weight: 1 })),
    ...profile.titles.map((role) => ({ role, weight: 0.7 })),
  ];
  let bestRole = { role: '', value: 0 };
  for (const { role, weight } of roles) {
    const value = roleSimilarity(role, job.title) * weight;
    if (value > bestRole.value) bestRole = { role, value };
  }
  const rolePoints = Math.round(50 * bestRole.value);
  if (bestRole.value >= 0.95) reasons.push(`Title matches ${bestRole.role}`);
  else if (bestRole.value >= 0.5) reasons.push(`Similar to ${bestRole.role}`);

  // Skills and keywords named in the title.
  const hits = [...profile.skills, ...profile.keywords].filter((skill, i, all) => {
    const firstIndex = all.findIndex((s) => s.toLowerCase() === skill.toLowerCase());
    return firstIndex === i && hasAny(title, skill);
  });
  const skillPoints = Math.min(15, hits.length * 8);
  reasons.push(...hits.slice(0, 3));

  // Location: preferred places, or the profile's own city.
  const location = normalise(job.location);
  const places = profile.preferredLocations.length > 0 ? profile.preferredLocations : [profile.location.split(',')[0] ?? ''];
  let locationPoints = 0;
  if (!job.location.trim()) locationPoints = 10;
  else {
    const place = places.find((p) => p.trim() && hasAny(location, p));
    if (place) {
      locationPoints = 20;
      reasons.push(place);
    } else if (/ remote /.test(location) && places.some((p) => /remote/i.test(p))) {
      locationPoints = 20;
      reasons.push('Remote');
    }
  }

  // Level: distance between the title's level and the profile's experience.
  // A title without a level word suits entry and mid-level candidates.
  const jobLevel = titleLevel(job.title);
  const myLevel = candidateLevel(profile.yearsExperience);
  let levelPoints = 10;
  if (myLevel !== null && jobLevel === null) levelPoints = myLevel <= 2 ? 15 : 10;
  else if (myLevel !== null && jobLevel !== null) {
    const distance = Math.abs(jobLevel - myLevel);
    levelPoints = Math.max(0, 15 - distance * 6);
    if (distance === 0) reasons.push(`${LEVEL_NAME[jobLevel]} fits`);
    if (jobLevel - myLevel >= 2) reasons.push(`${LEVEL_NAME[jobLevel]} may be a stretch`);
  }

  return {
    score: Math.min(100, rolePoints + skillPoints + locationPoints + levelPoints),
    reasons,
    alreadyApplied,
    excludedBy: null,
  };
}

/** Closest Applications career level for a job title (for prefilling the form). */
export function guessCareerLevel(title: string): string {
  const t = normalise(title);
  if (/ (intern|internship|magang) /.test(t)) return 'Internship';
  if (/ (lead|manager|head) /.test(t)) return 'Lead / Manager';
  if (/ (director|vp|chief) /.test(t)) return 'Director / Executive';
  if (/ (senior|sr|principal) /.test(t)) return 'Senior';
  if (/ (junior|jr|entry|graduate|trainee|mt|odp) /.test(t)) return 'Entry Level / Junior';
  return 'Not Specified';
}
