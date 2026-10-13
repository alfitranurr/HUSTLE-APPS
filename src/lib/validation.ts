import { z } from 'zod';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, JOB_STAGES, JOB_STATUSES, MASTERY_STATUSES } from './constants';

/** Shared request schemas (server-side source of truth; the forms mirror the rules). */

const required = (max: number) => z.string({ error: 'is required' }).trim().min(1, 'is required').max(max);
const optional = (max: number) => z.string().trim().max(max).default('');

/** Only http(s) links are stored; anything else (javascript:, data:, ...) is rejected. */
const link = z
  .string()
  .trim()
  .max(2048)
  .default('')
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'must be a valid URL');

export const jobFieldsSchema = z.object({
  company: required(200),
  position: optional(200),
  appliedAt: required(40),
  scheduledAt: optional(40),
  status: z.enum(JOB_STATUSES),
  stage: z.enum(JOB_STAGES),
  platform: required(80),
  careerLevel: optional(80),
  province: optional(120),
  city: optional(120),
  note: optional(5000),
  instagram: link,
  linkedin: link,
  website: link,
  otherLink: link,
});

export type JobFields = z.infer<typeof jobFieldsSchema>;

export const jobPatchSchema = z
  .object({
    stage: z.enum(JOB_STAGES).optional(),
    status: z.enum(JOB_STATUSES).optional(),
    /** Marks a follow-up: no field change, just bumps "last updated". */
    followedUp: z.literal(true).optional(),
  })
  .refine((v) => v.stage || v.status || v.followedUp, 'Nothing to update');

const interviewFields = {
  category: z.enum(INTERVIEW_CATEGORIES),
  question: required(1000),
  situation: z.string().trim().max(3000),
  task: z.string().trim().max(3000),
  action: z.string().trim().max(3000),
  result: z.string().trim().max(3000),
  targetCompany: z.string().trim().max(200),
  difficulty: z.enum(DIFFICULTIES),
  status: z.enum(MASTERY_STATUSES),
};

export const interviewCreateSchema = z.object({
  ...interviewFields,
  category: interviewFields.category.default('Behavioral'),
  situation: interviewFields.situation.default(''),
  task: interviewFields.task.default(''),
  action: interviewFields.action.default(''),
  result: interviewFields.result.default(''),
  targetCompany: interviewFields.targetCompany.default(''),
  difficulty: interviewFields.difficulty.default('Medium'),
  status: interviewFields.status.default('Practice Needed'),
});

/** No defaults here: a partial update must never reset fields that weren't sent. */
export const interviewUpdateSchema = z.object(interviewFields).partial();

export const grillSchema = z.object({
  answer: optional(10000),
  situation: optional(3000),
  task: optional(3000),
  action: optional(3000),
  result: optional(3000),
});

export const targetsSchema = z.object({
  applications: z.int().min(0).max(100),
  interviews: z.int().min(0).max(50),
});
