import type { CandidateProfile } from '@/lib/types';

/**
 * Reads the text of LinkedIn's "Save to PDF" profile export. The PDF has a
 * narrow left column (Contact, Top Skills, Languages, Certifications…) and a
 * main column (name, headline, location, Summary, Experience, Education), so
 * the two arrive as separate line lists.
 */

const SIDEBAR_SECTIONS = ['Contact', 'Top Skills', 'Languages', 'Certifications', 'Honors-Awards', 'Publications', 'Patents'];
const MAIN_SECTIONS = ['Summary', 'Experience', 'Education', 'Volunteer Experience', 'Projects', 'Honors-Awards'];

const MONTH = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)';
const DATE_RANGE = new RegExp(`^${MONTH}?\\s*(\\d{4})\\s*[-–]\\s*(Present|${MONTH}?\\s*(\\d{4}))`, 'i');
const PAGE_FOOTER = /^Page \d+ of \d+$/i;

/** Common skills worth spotting in the summary and experience text. */
export const KNOWN_SKILLS = [
  'SQL', 'MySQL', 'PostgreSQL', 'BigQuery', 'Python', 'R', 'Excel', 'Google Sheets', 'Power BI', 'Tableau', 'Looker',
  'Looker Studio', 'Metabase', 'Statistics', 'Data Analysis', 'Data Visualization', 'Data Cleaning', 'Machine Learning',
  'Deep Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'ETL', 'Airflow', 'dbt', 'Spark',
  'A/B Testing', 'Dashboard', 'Business Intelligence', 'Forecasting', 'JavaScript', 'TypeScript', 'React', 'Next.js',
  'Node.js', 'Java', 'Go', 'Docker', 'Git', 'Figma', 'Jira', 'Project Management', 'Product Management', 'Agile',
  'Scrum', 'Stakeholder Management', 'Communication', 'Leadership', 'Problem Solving', 'Microsoft Office', 'SAP',
  'Accounting', 'Finance', 'Marketing', 'Digital Marketing', 'SEO', 'Supply Chain', 'Operations', 'Research',
];

const containsWord = (haystack: string, word: string) =>
  new RegExp(`(^|[^a-z0-9+#])${word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9+#])`).test(
    haystack.toLowerCase()
  );

/** Splits lines into named sections; lines before the first heading go under ''. */
function sections(lines: string[], names: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>([['', []]]);
  let current = '';
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line || PAGE_FOOTER.test(line)) continue;
    const heading = names.find((n) => n.toLowerCase() === line.toLowerCase());
    if (heading) {
      current = heading;
      if (!map.has(current)) map.set(current, []);
      continue;
    }
    map.get(current)!.push(line);
  }
  return map;
}

const unique = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthIndex = (name: string | undefined) => (name ? Math.max(0, MONTHS.indexOf(name.slice(0, 3).toLowerCase())) : 0);

/** Months between the earliest start and the latest end of the experience date lines. */
function experienceYears(dateLines: RegExpExecArray[], now: Date): number | null {
  if (dateLines.length === 0) return null;
  let start = Infinity;
  let end = -Infinity;
  for (const m of dateLines) {
    const from = Number(m[2]) * 12 + monthIndex(m[1]);
    const to = /present/i.test(m[3]) ? now.getFullYear() * 12 + now.getMonth() : Number(m[5]) * 12 + monthIndex(m[4]);
    start = Math.min(start, from);
    end = Math.max(end, to);
  }
  return Math.max(0, Math.round(((end - start) / 12) * 10) / 10);
}

export function parseProfileText(sidebar: string[], main: string[], now = new Date()): Omit<CandidateProfile, 'parsedAt'> {
  const side = sections(sidebar, SIDEBAR_SECTIONS);
  const body = sections(main, MAIN_SECTIONS);

  // Top of the main column: name, headline (may wrap), then the location line.
  const intro = body.get('') ?? [];
  const name = intro[0] ?? '';
  const locationIndex = intro.findIndex((line, i) => i > 0 && /,|\b(indonesia|remote)\b/i.test(line) && line.length < 80);
  const headline = intro.slice(1, locationIndex > 0 ? locationIndex : 3).join(' ');
  const location = locationIndex > 0 ? intro[locationIndex] : '';

  // Experience: the line before each date range is the job title.
  const experience = body.get('Experience') ?? [];
  const dateMatches: RegExpExecArray[] = [];
  const titles: string[] = [];
  experience.forEach((line, i) => {
    const m = DATE_RANGE.exec(line);
    if (!m) return;
    dateMatches.push(m);
    const title = experience[i - 1];
    if (title && !DATE_RANGE.test(title)) titles.push(title);
  });

  const education = (body.get('Education') ?? []).filter((line) => !/^\(?\d{4}/.test(line) && !/^·/.test(line)).slice(0, 4);

  const allText = [...main, ...sidebar].join('\n');
  const skills = unique([
    ...(side.get('Top Skills') ?? []),
    ...KNOWN_SKILLS.filter((skill) => containsWord(allText, skill)),
  ]);

  return {
    name,
    headline,
    location,
    skills,
    titles: unique(titles),
    education,
    yearsExperience: experienceYears(dateMatches, now),
    targetRoles: unique(titles).slice(0, 3),
    preferredLocations: location ? [location.split(',')[0].trim()] : [],
    keywords: [],
    excludeKeywords: [],
  };
}
