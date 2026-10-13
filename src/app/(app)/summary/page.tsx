import type { Metadata } from 'next';
import { SummaryView } from '@/features/summary/SummaryView';

export const metadata: Metadata = { title: 'Insights' };

export default function SummaryPage() {
  return <SummaryView />;
}
