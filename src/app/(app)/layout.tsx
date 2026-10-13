import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getAuthEnv } from '@/lib/env';
import { getSession } from '@/lib/server/http';

/** Authenticated area. proxy.ts redirects first; this re-checks on the server (defence in depth). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { OWNER_NAME } = getAuthEnv();
  const ownerName = OWNER_NAME || session.sub.split('@')[0];

  return <AppShell ownerName={ownerName}>{children}</AppShell>;
}
