import type { Tone } from './tones';

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

/** 'No Response' closes an application that went silent (ghosted); it is not counted as active. */
export const JOB_STATUSES = ['Not Started', 'In Progress', 'Success', 'Failed', 'No Response'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_TONE: Record<JobStatus, Tone> = {
  'Not Started': 'amber',
  'In Progress': 'sky',
  Success: 'emerald',
  Failed: 'rose',
  'No Response': 'slate',
};

/** Ordered recruitment pipeline. */
export const JOB_STAGES = [
  'Not Started',
  'Document Screening',
  'Assessment Test',
  'HR Interview',
  'User Interview',
  'FGD/LGD',
  'Offering Letter',
  'Contract Signed / Done',
] as const;
export type JobStage = (typeof JOB_STAGES)[number];

export const STAGE_TONE: Record<JobStage, Tone> = {
  'Not Started': 'slate',
  'Document Screening': 'sky',
  'Assessment Test': 'cyan',
  'HR Interview': 'violet',
  'User Interview': 'fuchsia',
  'FGD/LGD': 'orange',
  'Offering Letter': 'indigo',
  'Contract Signed / Done': 'emerald',
};

/** Compact stage names for timelines and funnels; the first stage stands for "applied". */
export const STAGE_SHORT_LABEL: Record<JobStage, string> = {
  'Not Started': 'Applied',
  'Document Screening': 'Screening',
  'Assessment Test': 'Test',
  'HR Interview': 'HR Interview',
  'User Interview': 'User Interview',
  'FGD/LGD': 'FGD/LGD',
  'Offering Letter': 'Offer',
  'Contract Signed / Done': 'Signed',
};

/** Stages that have a scheduled date/time (stored in `scheduledAt`). */
export const SCHEDULED_STAGES: readonly JobStage[] = ['Assessment Test', 'HR Interview', 'User Interview'];

/** Stages where the contract date (stored in `contractDate`) applies. */
export const CONTRACT_STAGES: readonly JobStage[] = ['Offering Letter', 'Contract Signed / Done'];

/** An application counts as "interviewed" once it reaches this stage or later. */
export const FIRST_INTERVIEW_STAGE: JobStage = 'HR Interview';

export const PLATFORMS = [
  'LinkedIn',
  'JobStreet',
  'Glints',
  'Kalibrr',
  'Indeed',
  'Tech In Asia',
  '9CV9',
  'Direct Web',
  'Gmail',
  'Instagram',
  'Telegram',
  'G-Form / Microsoft Form',
  'Other',
] as const;

export const CAREER_LEVELS = [
  'Internship',
  'Kontrak/PKWT',
  'Entry Level / Junior',
  'Associate / Mid-Senior',
  'Senior',
  'Lead / Manager',
  'Director / Executive',
  'Not Specified',
] as const;

/** Applications in progress with no update for this many days need a follow-up. */
export const FOLLOW_UP_AFTER_DAYS = 14;

/** Open applications untouched this long are considered stale (likely no response). */
export const STALE_AFTER_DAYS = 60;

export const DEFAULT_WEEKLY_TARGETS = { applications: 5, interviews: 2 };

// ---------------------------------------------------------------------------
// Uploads (mirrored on the server in lib/server/uploads.ts)
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_FILES = 5;
export const MAX_UPLOAD_FILE_MB = 4;
export const ACCEPTED_UPLOADS = '.pdf,.png,.jpg,.jpeg,.webp';

// ---------------------------------------------------------------------------
// Interview practice
// ---------------------------------------------------------------------------

export const INTERVIEW_CATEGORIES = [
  'Behavioral',
  'Technical',
  'HR / General',
  'System Design',
  'Leadership',
  'Salary & Culture',
] as const;

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_TONE: Record<Difficulty, Tone> = { Easy: 'emerald', Medium: 'amber', Hard: 'rose' };

export const MASTERY_STATUSES = ['Practice Needed', 'Mastered'] as const;
export type MasteryStatus = (typeof MASTERY_STATUSES)[number];

export const STAR_PARTS = [
  { key: 'situation', letter: 'S', label: 'Situation', hint: 'Context and background', tone: 'indigo' },
  { key: 'task', letter: 'T', label: 'Task', hint: 'Your responsibility or goal', tone: 'violet' },
  { key: 'action', letter: 'A', label: 'Action', hint: 'What you specifically did', tone: 'fuchsia' },
  { key: 'result', letter: 'R', label: 'Result', hint: 'Measurable outcome', tone: 'emerald' },
] as const satisfies readonly { key: string; letter: string; label: string; hint: string; tone: Tone }[];
