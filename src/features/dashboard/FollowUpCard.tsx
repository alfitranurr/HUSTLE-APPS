'use client';

import { BellRing, CheckCheck, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { FOLLOW_UP_AFTER_DAYS } from '@/lib/constants';
import { followUpQueue } from '@/lib/followUp';
import type { Job } from '@/lib/types';

interface FollowUpCardProps {
  jobs: Job[];
  loading: boolean;
  onOpen: (job: Job) => void;
  onFollowedUp: (job: Job) => void;
}

export function FollowUpCard({ jobs, loading, onOpen, onFollowedUp }: FollowUpCardProps) {
  const queue = followUpQueue(jobs);

  return (
    <Card accent="amber" className="h-full">
      <CardHeader
        title="Needs follow-up"
        description={`In progress with no update for ${FOLLOW_UP_AFTER_DAYS}+ days`}
        icon={<BellRing className="mt-0.5 size-4 text-amber-500" />}
        action={
          queue.length > 5 && (
            <Link href="/tracker?followUp=yes" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              All {queue.length}
            </Link>
          )
        }
      />
      <CardContent>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : queue.length === 0 ? (
          <EmptyState icon={<PartyPopper className="size-5" />} title="You’re all caught up" description="No applications are waiting on a follow-up." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {queue.slice(0, 5).map(({ job, days }) => (
              <li key={job.id} className="flex items-center justify-between gap-3 border-l-4 border-amber-400 py-2.5 pr-1 pl-3">
                <button type="button" onClick={() => onOpen(job)} className="min-w-0 cursor-pointer text-left">
                  <span className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">{job.company}</span>
                  <span className="block text-xs text-slate-500">
                    {days} days since last update · {job.stage}
                  </span>
                </button>
                <Button variant="secondary" size="sm" icon={<CheckCheck className="size-3.5" />} onClick={() => onFollowedUp(job)}>
                  Followed up
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
