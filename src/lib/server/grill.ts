import 'server-only';
import type { GrillFeedback } from '@/lib/types';

/**
 * Rule-based STAR answer check. It looks for signals of each STAR part (in
 * English or Indonesian) plus length and numbers. No AI model is involved.
 */

interface Input {
  answer: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

const SIGNALS = {
  situation: ['when', 'while', 'during', 'at my', 'project', 'context', 'saat', 'ketika', 'proyek', 'waktu itu'],
  task: ['responsible', 'my role', 'goal', 'task', 'needed to', 'had to', 'tanggung jawab', 'tugas', 'peran', 'target'],
  action: ['i built', 'i led', 'i created', 'i decided', 'i implemented', 'i organised', 'i organized', 'i worked',
    'saya membuat', 'saya memimpin', 'saya melakukan', 'saya mengembangkan', 'saya menerapkan'],
  result: ['result', 'increased', 'reduced', 'improved', 'saved', 'achieved', 'delivered', 'berhasil', 'meningkat',
    'menurun', 'dampak', 'hasil'],
} as const;

const FEEDBACK = {
  situation: ['Context is clear.', 'Add a short, specific context: where, when and how big the problem was.'],
  task: ['Your responsibility is clear.', 'State your own goal or responsibility, not just the team’s.'],
  action: ['Your actions are concrete.', 'Describe what you personally did, using active verbs ("I built…", "I led…").'],
  result: ['The outcome is measurable.', 'Finish with a measurable result (%, time saved, revenue, users).'],
} as const;

export function scoreStarAnswer(input: Input): GrillFeedback {
  const answer =
    input.answer ||
    [input.situation, input.task, input.action, input.result].filter(Boolean).join('\n');
  const text = answer.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const hasNumber = /\d/.test(text);

  const covered = {
    situation: Boolean(input.situation) || SIGNALS.situation.some((s) => text.includes(s)),
    task: Boolean(input.task) || SIGNALS.task.some((s) => text.includes(s)),
    action: Boolean(input.action) || SIGNALS.action.some((s) => text.includes(s)),
    result: Boolean(input.result) || hasNumber || SIGNALS.result.some((s) => text.includes(s)),
  };

  let score = 40;
  if (covered.situation) score += 12;
  if (covered.task) score += 12;
  if (covered.action) score += 18;
  if (covered.result) score += 12;
  if (hasNumber) score += 6;
  if (words < 40) score -= 15;
  else if (words > 250) score -= 5;
  score = Math.max(20, Math.min(100, score));

  const parts = (['situation', 'task', 'action', 'result'] as const).map((key) => ({
    key,
    covered: covered[key],
    feedback: FEEDBACK[key][covered[key] ? 0 : 1],
  }));

  const suggestions: string[] = parts.filter((p) => !p.covered).map((p) => p.feedback);
  if (words < 40) suggestions.push('The answer is short. Aim for 1–2 minutes when spoken (roughly 120–250 words).');
  if (!hasNumber) suggestions.push('Numbers make results believable — add at least one concrete metric.');

  const summary =
    score >= 85
      ? 'Strong, well-structured STAR answer. Practise saying it out loud.'
      : score >= 65
        ? 'Good foundation. Tighten the weaker STAR parts below.'
        : 'Needs work. Make sure each STAR part is covered before your interview.';

  return { score, summary, parts, suggestions };
}
