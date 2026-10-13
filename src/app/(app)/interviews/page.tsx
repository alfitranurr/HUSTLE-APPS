import type { Metadata } from 'next';
import { InterviewsView } from '@/features/interviews/InterviewsView';

export const metadata: Metadata = { title: 'Interview prep' };

export default function InterviewsPage() {
  return <InterviewsView />;
}
