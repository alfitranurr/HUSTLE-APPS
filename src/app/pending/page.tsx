import { Ban, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';
import { AuthCard } from '@/features/auth/AuthCard';
import { getCurrentAccount } from '@/lib/server/account';

export const metadata: Metadata = { title: 'Waiting for approval' };

/** Where the (app) layout sends accounts that are not approved (yet). */
export default async function PendingPage() {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (account.status === 'approved') redirect('/dashboard');

  const suspended = account.status === 'suspended';

  return (
    <AuthCard
      title={suspended ? 'Access suspended' : 'Waiting for admin approval'}
      footer={
        <form action="/auth/signout" method="post">
          <button type="submit" className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900">
            Sign out
          </button>
        </form>
      }
    >
      <div
        role="status"
        className={
          suspended
            ? 'mt-5 flex gap-3 rounded-lg bg-rose-50 p-4 text-sm text-rose-900'
            : 'mt-5 flex gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900'
        }
      >
        {suspended ? (
          <Ban className="mt-0.5 size-5 shrink-0 text-rose-600" />
        ) : (
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
        )}
        <p>
          {suspended ? (
            <>The admin has suspended access for this account. Your data is kept, and you can use Hustle again if access is restored.</>
          ) : (
            <>
              Thanks for signing up! Every new account is reviewed by the admin before it can be used. You will be able
              to open your workspace as soon as your account is approved.
            </>
          )}
        </p>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Signed in as <span className="font-semibold break-all text-slate-700">{account.email}</span>
      </p>
      {/* The (app) layout re-checks the status and sends us back here if still not approved. */}
      <Link href="/dashboard" prefetch={false} className={buttonClasses('primary', 'md', 'mt-5 w-full')}>
        Check again
      </Link>
    </AuthCard>
  );
}
