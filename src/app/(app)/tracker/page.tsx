import type { Metadata } from 'next';
import type { JobFilters } from '@/features/jobs/filters';
import { TrackerView } from '@/features/jobs/TrackerView';
import { isSegment } from '@/lib/stats';

export const metadata: Metadata = { title: 'Applications' };

/** Deep links from the dashboard: /tracker?followUp=yes, /tracker?segment=offers */
export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ followUp?: string; segment?: string }>;
}) {
  const { followUp, segment } = await searchParams;
  const initialFilters: Partial<JobFilters> = {};
  if (followUp === 'yes') initialFilters.followUp = 'yes';
  if (isSegment(segment) && segment !== 'all') initialFilters.segment = segment;
  return <TrackerView initialFilters={initialFilters} />;
}
