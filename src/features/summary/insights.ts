import type { JobStats } from '@/lib/stats';

/** Plain-language suggestions derived from the funnel numbers. */
export function buildInsights(stats: JobStats): string[] {
  if (stats.total === 0) return ['Add a few applications to unlock insights about your search.'];
  const tips: string[] = [];

  if (stats.total >= 10 && stats.interviewRate < 10) {
    tips.push(
      `Only ${stats.interviewRate}% of applications reach an interview. Tailor your CV keywords to each posting and favour roles that closely match your experience.`
    );
  } else if (stats.interviewRate >= 25) {
    tips.push(`${stats.interviewRate}% of applications reach an interview — your CV is working. Focus on interview preparation.`);
  }

  if (stats.interviews >= 3 && stats.offers === 0) {
    tips.push('You are getting interviews but no offers yet. Practise STAR answers in Interview prep and ask for feedback after each round.');
  }

  if (stats.active > 0 && stats.active / stats.total > 0.7) {
    tips.push(`${stats.active} applications are still open. Follow up on the oldest ones to keep them moving.`);
  }

  if (tips.length === 0) tips.push('Steady progress. Keep a consistent weekly rhythm of applications and follow-ups.');
  return tips;
}
