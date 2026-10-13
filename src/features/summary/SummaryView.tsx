'use client';

import { Briefcase, Lightbulb, MessagesSquare, Trophy, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { JobListModal } from '@/features/jobs/JobListModal';
import {
  selectApplied,
  selectPosition,
  selectSegment,
  selectStatus,
  type JobSelection,
} from '@/features/jobs/selection';
import { useJobDialogs } from '@/features/jobs/useJobDialogs';
import { useJobs } from '@/hooks/useJobs';
import { STATUS_TONE, type JobStatus } from '@/lib/constants';
import { formatPercent, toDateKey } from '@/lib/format';
import {
  computeJobStats,
  countBy,
  filterByTimeframe,
  monthlyTimeline,
  pipelineFunnel,
  positionStats,
  rejectionPoints,
  TIMEFRAMES,
  timeframeStart,
  type Timeframe,
} from '@/lib/stats';
import { BreakdownList } from './BreakdownList';
import { FunnelCard } from './FunnelCard';
import { buildInsights } from './insights';
import { PositionsCard } from './PositionsCard';
import { ProfileCard } from './ProfileCard';
import { RejectionsCard } from './RejectionsCard';
import { TimelineChart } from './TimelineChart';

/** The open drill-down. `allTime` lists from every application (the timeline ignores the timeframe). */
interface Drill {
  selection: JobSelection;
  allTime?: boolean;
}

export function SummaryView() {
  const { jobs: allJobs, isLoading, mutate } = useJobs();
  const { handlers, dialogs } = useJobDialogs(mutate);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [showAllPositions, setShowAllPositions] = useState(false);

  const jobs = useMemo(() => filterByTimeframe(allJobs, timeframe), [allJobs, timeframe]);
  const data = useMemo(
    () => ({
      stats: computeJobStats(jobs),
      status: countBy(jobs, (j) => j.status),
      positions: countBy(jobs, (j) => j.position),
      funnel: pipelineFunnel(jobs),
      rejections: rejectionPoints(jobs),
      positionStats: positionStats(jobs),
    }),
    [jobs]
  );
  const timeline = useMemo(() => monthlyTimeline(allJobs), [allJobs]);
  const { stats } = data;
  const timeframeLabel = TIMEFRAMES.find((t) => t.value === timeframe)?.label;

  // Lists follow the timeframe, so the Applications deep link carries it too.
  const show = (selection: JobSelection) => {
    const start = timeframeStart(timeframe);
    const filters = start && selection.filters ? { ...selection.filters, from: toDateKey(start) } : selection.filters;
    setDrill({ selection: { ...selection, filters } });
  };
  const showPosition = (position: string) => {
    setShowAllPositions(false);
    show(selectPosition(position));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="How your search is converting. Select any number or row to see the companies behind it."
        actions={<SegmentedControl label="Timeframe" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Applications"
          value={stats.total}
          hint={timeframeLabel}
          tone="indigo"
          icon={<Briefcase className="size-4" />}
          loading={isLoading}
          onClick={() => show(selectSegment('all'))}
        />
        <StatCard
          label="Interview rate"
          value={formatPercent(stats.interviewRate)}
          hint={`${stats.interviews} reached an interview`}
          tone="violet"
          icon={<MessagesSquare className="size-4" />}
          loading={isLoading}
          onClick={() => show(selectSegment('interviews'))}
        />
        <StatCard
          label="Offer rate"
          value={formatPercent(stats.offerRate)}
          hint={`${stats.offers} ${stats.offers === 1 ? 'offer' : 'offers'}`}
          tone="emerald"
          icon={<Trophy className="size-4" />}
          loading={isLoading}
          onClick={() => show(selectSegment('offers'))}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          hint="Status set to Failed"
          tone="rose"
          icon={<XCircle className="size-4" />}
          loading={isLoading}
          onClick={() => show(selectSegment('rejected'))}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (
        <>
          <Card accent="amber">
            <CardHeader
              title="Key takeaways"
              description="What the numbers say and what to do next"
              icon={<Lightbulb className="mt-0.5 size-4 text-amber-500" />}
            />
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                {buildInsights(stats, data.funnel, data.rejections).map((tip) => (
                  <li key={tip} className="border-l-2 border-amber-300 pl-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What the applications look like: outcome, role and profile. */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card accent="sky" className="h-full">
              <CardHeader title="Status" description="Outcome of each application" />
              <CardContent>
                <BreakdownList
                  items={data.status}
                  total={stats.total}
                  tone={(n) => STATUS_TONE[n as JobStatus]}
                  onSelect={(status) => show(selectStatus(status as JobStatus))}
                />
              </CardContent>
            </Card>
            <PositionsCard stats={data.positionStats} onSelect={show} />
            <ProfileCard jobs={jobs} onSelect={show} />
          </div>

          {/* Where the search leaks: how far applications get and where they are turned down. */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FunnelCard steps={data.funnel} onSelect={show} />
            </div>
            <RejectionsCard points={data.rejections} noResponse={stats.noResponse} onSelect={show} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card accent="indigo">
              <CardHeader
                title="Top positions"
                description="Roles you apply for most"
                action={
                  data.positions.length > 8 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllPositions(true)}>
                      View all {data.positions.length}
                    </Button>
                  )
                }
              />
              <CardContent>
                <BreakdownList
                  items={data.positions.slice(0, 8)}
                  total={stats.total}
                  tone="indigo"
                  onSelect={showPosition}
                />
              </CardContent>
            </Card>
            <Card accent="emerald">
              <CardHeader
                title="Applications over time"
                description="Last 12 months · interviews counted by schedule date · select a month"
              />
              <CardContent>
                <TimelineChart
                  data={timeline}
                  onSelect={(month) =>
                    setDrill({ selection: selectApplied(month.name, month.from, month.to), allTime: true })
                  }
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <JobListModal
        key={drill?.selection.title ?? 'closed'}
        selection={drill?.selection ?? null}
        jobs={drill?.allTime ? allJobs : jobs}
        context={timeframe === 'all' || drill?.allTime ? undefined : `${timeframeLabel}, newest first.`}
        onClose={() => setDrill(null)}
        onOpen={(job) => {
          setDrill(null);
          handlers.onView(job);
        }}
      />
      {dialogs}

      <Modal open={showAllPositions} onClose={() => setShowAllPositions(false)} title="All positions" accent="indigo">
        <BreakdownList items={data.positions} total={stats.total} tone="indigo" onSelect={showPosition} />
      </Modal>
    </div>
  );
}
