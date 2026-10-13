import type { InterviewQuestionInput } from '@/lib/types';

type Starter = Pick<InterviewQuestionInput, 'category' | 'question' | 'difficulty' | 'notes'>;

/**
 * Common questions for entry-level data, business and management-trainee roles.
 * STAR fields stay empty: the story has to be the candidate's own. Notes say
 * what the interviewer is listening for, or how to prepare for a test.
 */
export const STARTER_QUESTIONS: readonly Starter[] = [
  // HR / General
  {
    category: 'HR / General',
    question: 'Tell me about yourself.',
    difficulty: 'Medium',
    notes:
      'Keep it to 60–90 seconds: present (current role or study), past (1–2 relevant achievements with numbers), future (why this role). End with why you applied here.',
  },
  {
    category: 'HR / General',
    question: 'Why do you want to work at this company?',
    difficulty: 'Easy',
    notes: 'Name something specific (product, recent news, values) and link it to your skills and what you want to learn.',
  },
  {
    category: 'HR / General',
    question: 'What are your strengths and weaknesses?',
    difficulty: 'Medium',
    notes:
      'Strength: one that matters for the role, with proof. Weakness: real but not critical, plus what you are doing to improve it.',
  },
  {
    category: 'HR / General',
    question: 'Where do you see yourself in 3–5 years?',
    difficulty: 'Easy',
    notes: "Show ambition that fits this role's growth path. Avoid naming a different job or company.",
  },
  {
    category: 'HR / General',
    question: 'Do you have any questions for us?',
    difficulty: 'Easy',
    notes:
      'Always ask 2–3: what success looks like in the first 3 months, the team’s biggest challenge right now, and the next steps in the process.',
  },
  {
    category: 'Salary & Culture',
    question: 'What are your salary expectations?',
    difficulty: 'Medium',
    notes:
      'Research the range for the role and city first (job boards, peers). Give a range with your target near the bottom, and say you are open to the full package.',
  },
  // Behavioral (STAR)
  {
    category: 'Behavioral',
    question: 'Tell me about a time you used data to influence a decision.',
    difficulty: 'Medium',
    notes: 'They listen for the business question, your analysis, how you explained it, and the decision or impact (with a number).',
  },
  {
    category: 'Behavioral',
    question: 'Describe a time you faced a tight deadline. How did you handle it?',
    difficulty: 'Medium',
    notes: 'Show prioritisation and communication, not just working late.',
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you made a mistake.',
    difficulty: 'Medium',
    notes: 'Own it, explain how you fixed it, and what you changed so it does not happen again.',
  },
  {
    category: 'Behavioral',
    question: 'Describe a disagreement with a teammate and how you resolved it.',
    difficulty: 'Medium',
    notes: 'Focus on listening and finding common ground. End on the outcome and the working relationship.',
  },
  {
    category: 'Leadership',
    question: 'Tell me about a time you took the initiative without being asked.',
    difficulty: 'Medium',
    notes: 'Pick a case where you spotted a problem yourself. Make the result measurable.',
  },
  // Technical (data / business)
  {
    category: 'Technical',
    question: 'Explain the difference between INNER JOIN, LEFT JOIN and FULL OUTER JOIN.',
    difficulty: 'Easy',
    notes:
      'Sketch two small tables. LEFT JOIN keeps every row of the left table with NULLs where nothing matches. Mention that duplicate keys multiply rows.',
  },
  {
    category: 'Technical',
    question: 'How would you get the top 3 products per category in SQL?',
    difficulty: 'Medium',
    notes:
      'Window function: ROW_NUMBER() or DENSE_RANK() OVER (PARTITION BY category ORDER BY sales DESC), then filter rank <= 3. Explain how ties differ between RANK and DENSE_RANK.',
  },
  {
    category: 'Technical',
    question: 'How do you clean a messy dataset before analysis?',
    difficulty: 'Medium',
    notes:
      'Duplicates, missing values (drop, impute or flag), types and formats, outliers, inconsistent categories. Document every step.',
  },
  {
    category: 'Technical',
    question: 'Which metrics would you track for an e-commerce or delivery app, and why?',
    difficulty: 'Hard',
    notes:
      'Start from the goal. Acquisition (CAC), activation, retention (D7/D30), revenue (AOV, GMV) and one north-star metric. Explain the trade-offs.',
  },
  {
    category: 'Technical',
    question: 'How would you explain an A/B test result to a non-technical stakeholder?',
    difficulty: 'Hard',
    notes: 'Lead with the decision. Give the effect size and confidence in plain words, then sample size and risks.',
  },
  // Assessment / Test
  {
    category: 'Assessment / Test',
    question: 'SQL test: joins, GROUP BY with HAVING, window functions, CTEs',
    difficulty: 'Medium',
    notes:
      'Practise 2–3 problems a day (LeetCode, HackerRank, StrataScratch), easy to medium. Time yourself at about 10 minutes per question. Review NULL handling and COUNT(DISTINCT).',
  },
  {
    category: 'Assessment / Test',
    question: 'Excel test: XLOOKUP/VLOOKUP, pivot tables, SUMIFS, IF, charts',
    difficulty: 'Medium',
    notes:
      'Rebuild a pivot table from raw data in under 5 minutes. Know absolute vs relative references ($A$1) and text/date clean-up (TRIM, TEXT, DATEVALUE).',
  },
  {
    category: 'Assessment / Test',
    question: 'Psikotes / aptitude: numerical and logical reasoning',
    difficulty: 'Medium',
    notes:
      'Practise number series, percentages, ratios, syllogisms and pattern questions under a timer. Accuracy first, then speed. Skip hard items and come back.',
  },
  {
    category: 'Assessment / Test',
    question: 'Take-home case study',
    difficulty: 'Hard',
    notes:
      'Clarify the question and assumptions first. Structure: problem → data checks → analysis → 3 insights → recommendation. Keep it to 5–7 slides with the answer on slide 1.',
  },
];
