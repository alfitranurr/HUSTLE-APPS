import type { Metadata } from 'next';
import { TrackerView } from '@/features/jobs/TrackerView';

export const metadata: Metadata = { title: 'Applications' };

export default async function TrackerPage({ searchParams }: { searchParams: Promise<{ followUp?: string }> }) {
  const { followUp } = await searchParams;
  return <TrackerView initialFilters={followUp === 'yes' ? { followUp: 'yes' } : undefined} />;
}
