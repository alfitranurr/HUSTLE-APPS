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
  /** Google Drive URLs of uploaded proof files. */
  attachments: string[];
  createdAt: string;
  updatedAt: string;
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

/** A parsed job before it is stored. */
export type ParsedJob = Pick<Recommendation, 'id' | 'title' | 'company' | 'location' | 'url'>;
