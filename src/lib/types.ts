import type { Difficulty, JobStage, JobStatus, MasteryStatus } from './constants';
import type { StageDates } from './stageDates';

export type { Difficulty, JobStage, JobStatus, MasteryStatus };

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
