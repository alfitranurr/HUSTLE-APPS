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
}

export function StatCard({ label, value, hint, icon, tone, loading }: StatCardProps) {
  return (
    <Card accent={tone} className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn('grid size-8 place-items-center rounded-lg', TONES[tone].soft, TONES[tone].text)}>
          {icon}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
