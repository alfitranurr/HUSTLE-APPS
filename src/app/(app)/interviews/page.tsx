import type { Metadata } from 'next';
import { InterviewsView } from '@/features/interviews/InterviewsView';

export const metadata: Metadata = { title: 'Interview prep' };

/** Deep link from an application: /interviews?company=Acme */
export default async function InterviewsPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { company } = await searchParams;
  const initialCompany = typeof company === 'string' ? company.trim().slice(0, 200) : '';
  return <InterviewsView initialCompany={initialCompany} />;
}
