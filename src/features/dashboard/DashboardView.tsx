'use client';

import { Briefcase, Activity, MessagesSquare, Trophy, Plus, RotateCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { useJobDialogs } from '@/features/jobs/useJobDialogs';
import { useJobMutations } from '@/features/jobs/useJobMutations';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/cn';
import { computeJobStats } from '@/lib/stats';
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
        <StatCard label="Applications" value={stats.total} tone="indigo" icon={<Briefcase className="size-4" />} loading={isLoading} hint="All time" />
        <StatCard label="Active" value={stats.active} tone="sky" icon={<Activity className="size-4" />} loading={isLoading} hint="Not started or in progress" />
        <StatCard
          label="Interviews"
          value={stats.interviews}
          tone="violet"
          icon={<MessagesSquare className="size-4" />}
          loading={isLoading}
          hint={`${stats.interviewRate}% of applications`}
        />
        <StatCard
          label="Offers"
          value={stats.offers}
          tone="emerald"
          icon={<Trophy className="size-4" />}
          loading={isLoading}
          hint={`${stats.offerRate}% success rate`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingCard jobs={jobs} loading={isLoading} onOpen={handlers.onView} />
        </div>
        <WeeklyTargetsCard jobs={jobs} loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpCard jobs={jobs} loading={isLoading} onOpen={handlers.onView} onFollowedUp={markFollowedUp} />
        <RecentApplications jobs={jobs} loading={isLoading} onOpen={handlers.onView} />
      </div>

      {isLoading ? <Skeleton className="h-56" /> : <ActivityHeatmap jobs={jobs} />}

      {dialogs}
    </div>
  );
}
