'use client';

import { Activity, Briefcase, MessagesSquare, Plus, RotateCw, Trophy } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { JobListModal } from '@/features/jobs/JobListModal';
import { useJobDialogs } from '@/features/jobs/useJobDialogs';
import { useJobMutations } from '@/features/jobs/useJobMutations';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/cn';
import { computeJobStats, type Segment } from '@/lib/stats';
import { ActivityHeatmap } from './ActivityHeatmap';
import { FollowUpCard } from './FollowUpCard';
import { RecentApplications } from './RecentApplications';
import { UpcomingCard } from './UpcomingCard';
import { WeeklyTargetsCard } from './WeeklyTargetsCard';

export function DashboardView() {
  const { jobs, isLoading, isValidating, mutate } = useJobs();
  const { openCreate, handlers, dialogs } = useJobDialogs(mutate);
  const { markFollowedUp } = useJobMutations(mutate);
  const stats = computeJobStats(jobs);
  const [segment, setSegment] = useState<Segment | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Where your job search stands today."
        actions={
          <>
            <IconButton
              variant="secondary"
              size="md"
              label="Refresh"
              icon={<RotateCw className={cn('size-4', isValidating && 'animate-spin')} />}
              onClick={() => mutate()}
              disabled={isValidating}
            />
            <Button icon={<Plus className="size-4" />} onClick={openCreate}>
              Add application
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" onClick={() => setSegment('all')} value={stats.total} tone="indigo" icon={<Briefcase className="size-4" />} loading={isLoading} hint="All time" />
        <StatCard label="Active" onClick={() => setSegment('active')} value={stats.active} tone="sky" icon={<Activity className="size-4" />} loading={isLoading} hint="Not started or in progress" />
        <StatCard
          label="Interviews" onClick={() => setSegment('interviews')}
          value={stats.interviews}
          tone="violet"
          icon={<MessagesSquare className="size-4" />}
          loading={isLoading}
          hint={`${stats.interviewRate}% of applications`}
        />
        <StatCard
          label="Offers" onClick={() => setSegment('offers')}
          value={stats.offers}
          tone="emerald"
          icon={<Trophy className="size-4" />}
          loading={isLoading}
          hint={`${stats.offerRate}% success rate`}
        />
      </div>

      {/* Two rows on laptops; on wide screens everything fits in one 4-column row. */}
      <div className="grid gap-6 lg:grid-cols-3 3xl:grid-cols-4">
        <div className="lg:col-span-2 3xl:col-span-1">
          <UpcomingCard jobs={jobs} loading={isLoading} onOpen={handlers.onView} />
        </div>
        <WeeklyTargetsCard jobs={jobs} loading={isLoading} />
        <div className="grid gap-6 lg:col-span-3 lg:grid-cols-2 3xl:col-span-2">
          <FollowUpCard jobs={jobs} loading={isLoading} onOpen={handlers.onView} onFollowedUp={markFollowedUp} />
          <RecentApplications jobs={jobs} loading={isLoading} onOpen={handlers.onView} />
        </div>
      </div>

      {isLoading ? <Skeleton className="h-56" /> : <ActivityHeatmap jobs={jobs} />}

      <JobListModal
        key={segment ?? 'closed'}
        segment={segment}
        jobs={jobs}
        onClose={() => setSegment(null)}
        onOpen={(job) => {
          setSegment(null);
          handlers.onView(job);
        }}
      />
      {dialogs}
    </div>
  );
}
