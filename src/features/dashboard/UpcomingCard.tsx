import { CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { SCHEDULED_STAGES, STAGE_TONE } from '@/lib/constants';
import { formatDateTime, formatRelative, parseDate } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';

export function upcomingEvents(jobs: Job[], now = new Date()) {
  return jobs
    .filter((job) => job.status !== 'Failed' && SCHEDULED_STAGES.includes(job.stage))
    .map((job) => ({ job, at: parseDate(job.scheduledAt) }))
    .filter((e): e is { job: Job; at: Date } => e.at !== null && e.at >= now)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function UpcomingCard({ jobs, loading, onOpen }: { jobs: Job[]; loading: boolean; onOpen: (job: Job) => void }) {
  const events = upcomingEvents(jobs).slice(0, 6);

  return (
    <Card accent="violet" className="h-full">
      <CardHeader
        title="Upcoming tests & interviews"
        description="Your next scheduled steps"
        action={
          <Link href="/tracker" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        }
      />
      <CardContent>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-5" />}
            title="Nothing scheduled"
            description="When you move an application to a test or interview stage, add its date and it shows up here."
          />
        ) : (
          <ul className="space-y-2">
            {events.map(({ job, at }) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => onOpen(job)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-l-4 border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50',
                    TONES[STAGE_TONE[job.stage]].edge
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{job.company}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {job.stage}
                      {job.position && ` · ${job.position}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-medium text-slate-700 tabular-nums">{formatDateTime(job.scheduledAt)}</span>
                    <Badge tone={STAGE_TONE[job.stage]} className="mt-1">
                      {formatRelative(at)}
                    </Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
