import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone: Tone;
  loading?: boolean;
  /** Makes the whole card a button (e.g. to list the items behind the number). */
  onClick?: () => void;
  actionLabel?: string;
}

export function StatCard({ label, value, hint, icon, tone, loading, onClick, actionLabel = 'View companies' }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn('grid size-8 place-items-center rounded-lg', TONES[tone].soft, TONES[tone].text)}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {onClick && (
        <span className={cn('mt-3 inline-flex items-center gap-0.5 text-xs font-semibold', TONES[tone].text)}>
          {actionLabel}
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  if (!onClick) {
    return (
      <Card accent={tone} className="p-4 sm:p-5">
        {body}
      </Card>
    );
  }

  return (
    <Card accent={tone} className="transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="group block h-full w-full cursor-pointer p-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default sm:p-5"
      >
        {body}
      </button>
    </Card>
  );
}
