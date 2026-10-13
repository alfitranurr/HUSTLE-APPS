import type { Metadata } from 'next';
import type { JobFilters } from '@/features/jobs/filters';
import { TrackerView } from '@/features/jobs/TrackerView';
import { JOB_STAGES, JOB_STATUSES, type JobStage, type JobStatus } from '@/lib/constants';
import { isSegment } from '@/lib/stats';

export const metadata: Metadata = { title: 'Applications' };

type Params = Partial<Record<keyof JobFilters, string>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FREE_TEXT = ['search', 'position', 'careerLevel', 'province'] as const;

/**
 * Deep links from the dashboard and insights, e.g. /tracker?followUp=yes,
 * /tracker?segment=rejected&stage=Assessment%20Test, /tracker?position=Data%20Analyst.
 */
export default async function TrackerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const initialFilters: Partial<JobFilters> = {};
  if (params.followUp === 'yes') initialFilters.followUp = 'yes';
  if (isSegment(params.segment) && params.segment !== 'all') initialFilters.segment = params.segment;
  if (JOB_STATUSES.includes(params.status as JobStatus)) initialFilters.status = params.status;
  if (JOB_STAGES.includes(params.stage as JobStage)) initialFilters.stage = params.stage;
  for (const key of FREE_TEXT) {
    const value = params[key];
    if (typeof value === 'string' && value.length <= 120) initialFilters[key] = value;
  }
  for (const key of ['from', 'to'] as const) {
    const value = params[key];
    if (typeof value === 'string' && DATE.test(value)) initialFilters[key] = value;
  }
  return <TrackerView initialFilters={initialFilters} />;
}
