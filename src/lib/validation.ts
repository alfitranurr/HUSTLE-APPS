import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).default('');

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

export const jobFormSchema = z.object({
  company: z.string().trim().min(1, 'is required').max(200),
  kategori: text(200),
  startDate: z.string().trim().min(1, 'is required').max(40),
  endDate: text(40),
  status: z.string().trim().min(1, 'is required').max(40),
  platform: z.string().trim().min(1, 'is required').max(80),
  careerLevel: text(80),
  currentStage: z.string().trim().min(1, 'is required').max(80),
  province: text(120),
  city: text(120),
  note: text(5000),
  linkIg: link,
  linkLi: link,
  linkWeb: link,
  linkOther: link,
});

export type JobFormInput = z.infer<typeof jobFormSchema>;

const interviewFields = {
  category: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1, 'is required').max(1000),
  situation: z.string().trim().max(3000),
  task: z.string().trim().max(3000),
  action: z.string().trim().max(3000),
  result: z.string().trim().max(3000),
  targetcompany: z.string().trim().max(200),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  status: z.enum(['Mastered', 'Practice Needed']),
};

export const interviewSchema = z.object({
  ...interviewFields,
  category: interviewFields.category.default('Behavioral'),
  situation: interviewFields.situation.default(''),
  task: interviewFields.task.default(''),
  action: interviewFields.action.default(''),
  result: interviewFields.result.default(''),
  targetcompany: interviewFields.targetcompany.default(''),
  difficulty: interviewFields.difficulty.default('Medium'),
  status: interviewFields.status.default('Practice Needed'),
});

/** No defaults here: a partial update must never reset fields that weren't sent. */
export const interviewUpdateSchema = z.object(interviewFields).partial();

export const grillSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  answer: text(10000),
  situation: text(3000),
  task: text(3000),
  action: text(3000),
  result: text(3000),
});
