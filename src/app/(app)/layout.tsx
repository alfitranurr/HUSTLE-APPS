import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getCurrentAccount } from '@/lib/server/account';

/**
 * Signed-in, approved area. proxy.ts redirects signed-out visitors first; this
 * re-checks on the server and also sends pending/suspended accounts to /pending.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (account.status !== 'approved') redirect('/pending');

  return (
    <AppShell account={{ displayName: account.displayName, email: account.email, isAdmin: account.isAdmin }}>
      {children}
    </AppShell>
  );
}
