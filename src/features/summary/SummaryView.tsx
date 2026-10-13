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
import { useJobDialogs } from '@/features/jobs/useJobDialogs';
import { useJobs } from '@/hooks/useJobs';
import { STAGE_TONE, STATUS_TONE, type JobStage, type JobStatus } from '@/lib/constants';
import { shortProvince } from '@/lib/format';
import {
  computeJobStats,
  countBy,
  filterByTimeframe,
  monthlyTimeline,
  TIMEFRAMES,
  type Segment,
  type Timeframe,
} from '@/lib/stats';
import { BreakdownList } from './BreakdownList';
import { buildInsights } from './insights';
import { PositionsChart } from './PositionsChart';
import { TimelineChart } from './TimelineChart';

const stripRegionPrefix = (city: string) => city.replace(/^(Kota|Kabupaten)\s+/i, '');

export function SummaryView() {
  const { jobs: allJobs, isLoading, mutate } = useJobs();
  const { handlers, dialogs } = useJobDialogs(mutate);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [showAllPositions, setShowAllPositions] = useState(false);

  const jobs = useMemo(() => filterByTimeframe(allJobs, timeframe), [allJobs, timeframe]);
  const data = useMemo(
    () => ({
      stats: computeJobStats(jobs),
      status: countBy(jobs, (j) => j.status),
      stage: countBy(jobs, (j) => j.stage),
      level: countBy(jobs, (j) => j.careerLevel || 'Not Specified'),
      city: countBy(jobs, (j) => stripRegionPrefix(j.city), 6),
      province: countBy(jobs, (j) => shortProvince(j.province), 6),
      platform: countBy(jobs, (j) => j.platform || 'Other', 6),
      positions: countBy(jobs, (j) => j.position),
      companies: countBy(jobs, (j) => j.company, 5),
    }),
    [jobs]
  );
  const timeline = useMemo(() => monthlyTimeline(allJobs), [allJobs]);
  const { stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="How your search is converting, and where your applications go."
        actions={<SegmentedControl label="Timeframe" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Applications"
          value={stats.total}
          hint={TIMEFRAMES.find((t) => t.value === timeframe)?.label}
          tone="indigo"
          icon={<Briefcase className="size-4" />}
          loading={isLoading}
          onClick={() => setSegment('all')}
        />
        <StatCard
          label="Interview rate"
          value={`${stats.interviewRate}%`}
          hint={`${stats.interviews} reached an interview`}
          tone="violet"
          icon={<MessagesSquare className="size-4" />}
          loading={isLoading}
          onClick={() => setSegment('interviews')}
        />
        <StatCard
          label="Offer rate"
          value={`${stats.offerRate}%`}
          hint={`${stats.offers} ${stats.offers === 1 ? 'offer' : 'offers'}`}
          tone="emerald"
          icon={<Trophy className="size-4" />}
          loading={isLoading}
          onClick={() => setSegment('offers')}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          hint="Status set to Failed"
          tone="rose"
          icon={<XCircle className="size-4" />}
          loading={isLoading}
          onClick={() => setSegment('rejected')}
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
            <CardHeader title="Recommendations" icon={<Lightbulb className="mt-0.5 size-4 text-amber-500" />} />
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                {buildInsights(stats).map((tip) => (
                  <li key={tip} className="border-l-2 border-amber-300 pl-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card accent="sky">
              <CardHeader title="Status" description="Outcome of each application" />
              <CardContent>
                <BreakdownList items={data.status} total={stats.total} tone={(n) => STATUS_TONE[n as JobStatus]} />
              </CardContent>
            </Card>
            <Card accent="violet">
              <CardHeader title="Pipeline stage" description="Where applications currently are" />
              <CardContent>
                <BreakdownList items={data.stage} total={stats.total} tone={(n) => STAGE_TONE[n as JobStage]} />
              </CardContent>
            </Card>
            <Card accent="fuchsia">
              <CardHeader title="Career level" />
              <CardContent>
                <BreakdownList items={data.level} total={stats.total} tone="fuchsia" />
              </CardContent>
            </Card>
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
                <PositionsChart data={data.positions.slice(0, 8)} />
              </CardContent>
            </Card>
            <Card accent="emerald">
              <CardHeader title="Applications over time" description="Last 12 months · interviews counted by schedule date" />
              <CardContent>
                <TimelineChart data={timeline} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card accent="teal">
              <CardHeader title="Top cities" />
              <CardContent>
                <BreakdownList items={data.city} total={stats.total} tone="teal" />
              </CardContent>
            </Card>
            <Card accent="cyan">
              <CardHeader title="Top provinces" />
              <CardContent>
                <BreakdownList items={data.province} total={stats.total} tone="cyan" />
              </CardContent>
            </Card>
            <Card accent="orange">
              <CardHeader title="Platforms" description="Where you found the job" />
              <CardContent>
                <BreakdownList items={data.platform} total={stats.total} tone="orange" />
              </CardContent>
            </Card>
            <Card accent="indigo">
              <CardHeader title="Most applied companies" />
              <CardContent>
                <BreakdownList items={data.companies} total={stats.total} tone="indigo" />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <JobListModal
        key={segment ?? 'closed'}
        segment={segment}
        jobs={jobs}
        context={
          timeframe === 'all' ? undefined : `${TIMEFRAMES.find((t) => t.value === timeframe)?.label}, newest first.`
        }
        onClose={() => setSegment(null)}
        onOpen={(job) => {
          setSegment(null);
          handlers.onView(job);
        }}
      />
      {dialogs}

      <Modal open={showAllPositions} onClose={() => setShowAllPositions(false)} title="All positions" accent="indigo">
        <BreakdownList items={data.positions} total={stats.total} tone="indigo" />
      </Modal>
    </div>
  );
}
