import type { Difficulty, JobStage, JobStatus, MasteryStatus } from './constants';

export type { Difficulty, JobStage, JobStatus, MasteryStatus };

/** A job application. Dates are stored as strings exactly as they live in the sheet; use `parseDate`. */
export interface Job {
  id: string;
  company: string;
  position: string;
  appliedAt: string;
  /** Date/time of the upcoming assessment or interview, if any. */
  scheduledAt: string;
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
}

export type InterviewQuestionInput = Omit<InterviewQuestion, 'id'>;

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
