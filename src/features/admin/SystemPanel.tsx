'use client';

import { AlertTriangle, CheckCircle2, Database, HardDrive, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import type { AdminSystemHealth } from '@/lib/types';

/** Supabase free plan limits, for the usage bars. */
const FREE_DATABASE_BYTES = 500 * 1024 * 1024;
const FREE_STORAGE_BYTES = 1024 * 1024 * 1024;

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const CHECK_STYLE = {
  ok: { icon: CheckCircle2, className: 'text-emerald-600' },
  warn: { icon: AlertTriangle, className: 'text-amber-600' },
  error: { icon: XCircle, className: 'text-rose-600' },
} as const;

export function SystemPanel({ health, loading }: { health: AdminSystemHealth | undefined; loading: boolean }) {
  if (loading || !health) {
    return (
      <Card accent="sky" className="p-5">
        <SkeletonRows rows={5} />
      </Card>
    );
  }
  const { stats, checks } = health;
  // Account and capacity figures only: no usage or content counts (privacy, 0005_admin_privacy.sql).
  const totals = [
    { label: 'Accounts', value: stats.usersTotal },
    { label: 'Waiting for approval', value: stats.usersPending },
    { label: 'Active API tokens', value: stats.activeTokens },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card accent="sky">
        <CardHeader title="Health" description="Checked just now" />
        <CardContent>
          <ul className="space-y-3">
            {checks.map((check) => {
              const { icon: Icon, className } = CHECK_STYLE[check.status];
              return (
                <li key={check.label} className="flex items-start gap-3 text-sm">
                  <Icon className={cn('mt-0.5 size-4 shrink-0', className)} />
                  <span>
                    <span className="block font-medium text-slate-900">{check.label}</span>
                    <span className="block text-slate-500">{check.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card accent="violet">
        <CardHeader title="Capacity" description="Supabase free plan limits. How people use Hustle is not shown." />
        <CardContent className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {totals.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{item.label}</dt>
                <dd className="text-lg font-bold text-slate-900 tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Database className="size-4 text-slate-400" /> Database
              </span>
              <span className="text-slate-500 tabular-nums">{mb(stats.databaseBytes)} of 500 MB</span>
            </p>
            <ProgressBar value={(stats.databaseBytes / FREE_DATABASE_BYTES) * 100} tone="sky" label="Database size" />
          </div>
          <div>
            <p className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <HardDrive className="size-4 text-slate-400" /> Proof files
              </span>
              <span className="text-slate-500 tabular-nums">{mb(stats.storageBytes)} of 1 GB</span>
            </p>
            <ProgressBar value={(stats.storageBytes / FREE_STORAGE_BYTES) * 100} tone="violet" label="Storage used" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
