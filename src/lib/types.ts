import type { Difficulty, JobStage, JobStatus, MasteryStatus, RecommendationSource, RecommendationStatus } from './constants';
import type { StageDates } from './stageDates';

export type { Difficulty, JobStage, JobStatus, MasteryStatus, RecommendationSource, RecommendationStatus };

/** A job application. Dates are stored as strings exactly as they live in the sheet; use `parseDate`. */
export interface Job {
  id: string;
  company: string;
  position: string;
  appliedAt: string;
  /** Date/time of the upcoming assessment or interview, if any. */
  scheduledAt: string;
  /** Contract (start) date once an offer is made or signed, yyyy-mm-dd. */
  contractDate: string;
  /** When each pipeline stage was reached; the first stage uses `appliedAt`. */
  stageDates: StageDates;
  status: JobStatus;
  stage: JobStage;
  platform: string;
  careerLevel: string;
  province: string;
  city: string;
  note: string;
  links: {
    instagram: string;
    linkedin: string;
    website: string;
    other: string;
  };
  /** Uploaded proof files. */
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

/** A proof file. `url` is an app route that redirects to a short-lived signed URL. */
export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  targetCompany: string;
  difficulty: Difficulty;
  status: MasteryStatus;
  /** Key points to cover, or study notes for a test. */
  notes: string;
  /** ISO timestamp of the last practice round; '' when never practised. */
  lastPracticedAt: string;
  practiceCount: number;
}

/** What the user edits; practice tracking is only changed by the practice endpoint. */
export type InterviewQuestionInput = Omit<InterviewQuestion, 'id' | 'lastPracticedAt' | 'practiceCount'>;

export interface WeeklyTargets {
  applications: number;
  interviews: number;
}

export interface GrillFeedback {
  score: number;
  summary: string;
  parts: { key: 'situation' | 'task' | 'action' | 'result'; covered: boolean; feedback: string }[];
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Job match (LinkedIn recommendations, rule-based)
// ---------------------------------------------------------------------------

/** Read from LinkedIn's "Save to PDF" export, then edited by the owner. */
export interface CandidateProfile {
  name: string;
  headline: string;
  location: string;
  /** Skills from the PDF plus anything the owner adds. */
  skills: string[];
  /** Job titles held, newest first. */
  titles: string[];
  education: string[];
  /** Rough total from the experience dates; null when unknown. */
  yearsExperience: number | null;
  /** What the owner is looking for; these drive the score most. */
  targetRoles: string[];
  preferredLocations: string[];
  /** Extra words that count as a match (tools, domains). */
  keywords: string[];
  /** Any of these in a title sets the score to 0. */
  excludeKeywords: string[];
  /** ISO time the PDF was read; '' when no PDF yet. */
  parsedAt: string;
}

export type ProfileInput = Omit<CandidateProfile, 'parsedAt'>;

/** One job LinkedIn recommended (from a recommendations email or the pasted "Top job picks" page). */
export interface Recommendation {
  /** LinkedIn job id when known, otherwise a hash of title + company + location. */
  id: string;
  title: string;
  company: string;
  location: string;
  /** Job page on LinkedIn; '' when it came from pasted text without links. */
  url: string;
  source: RecommendationSource;
  /** ISO time the email arrived or the text was pasted. */
  receivedAt: string;
  status: RecommendationStatus;
}

// ---------------------------------------------------------------------------
// Admin panel: account management data only. No usage or content figures
// (data minimisation, UU PDP / GDPR); see 0005_admin_privacy.sql.
// ---------------------------------------------------------------------------

export type AccountStatus = 'pending' | 'approved' | 'suspended';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  isAdmin: boolean;
  /** ISO times; '' when it never happened. */
  createdAt: string;
  emailConfirmedAt: string;
  lastSignInAt: string;
  reviewedAt: string;
}

export interface AdminSystemStats {
  usersTotal: number;
  usersPending: number;
  usersApproved: number;
  usersSuspended: number;
  activeTokens: number;
  /** Capacity only: total size of proof files and of the database. */
  storageBytes: number;
  databaseBytes: number;
}

export interface AdminSystemHealth {
  stats: AdminSystemStats;
  /** Round trip of the stats query, ms. */
  databaseLatencyMs: number;
  checks: { label: string; status: 'ok' | 'warn' | 'error'; detail: string }[];
}

/** An API token as the owner sees it: never the token itself. */
export interface ApiTokenInfo {
  id: string;
  name: string;
  /** First 8 characters, e.g. "hst_ab12". */
  prefix: string;
  /** ISO times; '' when it never happened. */
  createdAt: string;
  lastUsedAt: string;
  revokedAt: string;
  /** Turned off by an admin rather than by the owner. */
  revokedByAdmin: boolean;
}

/** An access key as the admin sees it (0006_admin_tokens.sql): never the key itself. */
export interface AdminToken {
  id: string;
  userId: string;
  email: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string;
  revokedAt: string;
  revokedByAdmin: boolean;
}

/** A parsed job before it is stored. */
export type ParsedJob = Pick<Recommendation, 'id' | 'title' | 'company' | 'location' | 'url'>;
