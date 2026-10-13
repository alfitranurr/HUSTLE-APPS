import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { STATUS_TONE } from '@/lib/constants';
import { formatDate, parseDate } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';

export function RecentApplications({ jobs, loading, onOpen }: { jobs: Job[]; loading: boolean; onOpen: (job: Job) => void }) {
  const recent = [...jobs]
    .sort((a, b) => (parseDate(b.appliedAt)?.getTime() ?? 0) - (parseDate(a.appliedAt)?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <Card accent="sky" className="h-full">
      <CardHeader
        title="Recent applications"
        action={
          <Link href="/tracker" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        }
      />
      <CardContent>
        {loading ? (
          <SkeletonRows rows={5} />
        ) : recent.length === 0 ? (
          <EmptyState icon={<Briefcase className="size-5" />} title="No applications yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => onOpen(job)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 border-l-4 py-3 pr-1 pl-3 text-left hover:bg-slate-50',
                    TONES[STATUS_TONE[job.status]].edge
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{job.company}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {job.position || 'Position not set'} · {formatDate(job.appliedAt)}
                    </span>
                  </span>
                  <StatusBadge status={job.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
