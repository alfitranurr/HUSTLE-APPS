import type { Metadata } from 'next';
import { TrackerView } from '@/features/jobs/TrackerView';

export const metadata: Metadata = { title: 'Applications' };

export default function TrackerPage() {
  return <TrackerView />;
}
