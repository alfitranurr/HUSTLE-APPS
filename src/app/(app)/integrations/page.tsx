import type { Metadata } from 'next';
import { IntegrationsView } from '@/features/integrations/IntegrationsView';

export const metadata: Metadata = { title: 'Connect AI' };

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
