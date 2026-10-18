import type { Metadata } from 'next';
import { MatchesView } from '@/features/matches/MatchesView';

export const metadata: Metadata = { title: 'Job match' };

export default function MatchesPage() {
  return <MatchesView />;
}
