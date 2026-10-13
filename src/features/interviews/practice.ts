import type { InterviewQuestion } from '@/lib/types';

/** Spoken answers should land within about two minutes. */
export const PRACTICE_SECONDS = 120;

const practisedAt = (q: InterviewQuestion) => (q.lastPracticedAt ? Date.parse(q.lastPracticedAt) || 0 : 0);

/**
 * Order for a practice round: questions that still need practice first, then
 * the ones practised longest ago (never practised first). Ties are shuffled so
 * repeated rounds don't always start with the same question.
 */
export function practiceQueue(questions: InterviewQuestion[], random = Math.random): InterviewQuestion[] {
  return questions
    .map((q) => ({ q, tie: random() }))
    .sort(
      (a, b) =>
        Number(a.q.status === 'Mastered') - Number(b.q.status === 'Mastered') ||
        practisedAt(a.q) - practisedAt(b.q) ||
        a.tie - b.tie
    )
    .map(({ q }) => q);
}

export function practisedWithin(questions: InterviewQuestion[], days: number, now = Date.now()): number {
  const since = now - days * 24 * 60 * 60 * 1000;
  return questions.filter((q) => practisedAt(q) >= since).length;
}

export const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
