'use client';

import { Briefcase, Download, Columns3, LayoutGrid, List, Plus, RotateCw, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/cn';
import { toDateKey } from '@/lib/format';
import type { Job } from '@/lib/types';
import { DEFAULT_SORT, distinct, EMPTY_FILTERS, filterJobs, sortJobs, type JobFilters, type SortKey, type SortState } from './filters';
import { downloadCsv, jobsToCsv } from './csv';
import type { JobActionHandlers } from './JobActions';
import { JobCard } from './JobCard';
import { JobKanban } from './JobKanban';
import { JobTable } from './JobTable';
import { TrackerFilters } from './TrackerFilters';
import { useJobDialogs } from './useJobDialogs';
import { useJobMutations } from './useJobMutations';

type View = 'table' | 'cards' | 'board';
const PAGE_SIZE = 20;

export function TrackerView({ initialFilters }: { initialFilters?: Partial<JobFilters> }) {
  const { jobs, error, isLoading, isValidating, mutate } = useJobs();
  const { openCreate, handlers, dialogs } = useJobDialogs(mutate);
  const { moveToStage } = useJobMutations(mutate);

  const [view, setView] = useState<View>('table');
  const [filters, setFilters] = useState<JobFilters>({ ...EMPTY_FILTERS, ...initialFilters });
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const updateFilters = (changes: Partial<JobFilters>) => {
    setFilters((f) => ({ ...f, ...changes }));
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: key === 'appliedAt' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const options = useMemo(
    () => ({ provinces: distinct(jobs, (j) => j.province), positions: distinct(jobs, (j) => j.position) }),
    [jobs]
  );
  const visible = useMemo(() => sortJobs(filterJobs(jobs, filters), sort), [jobs, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageJobs = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const renderContent = () => {
    if (isLoading) return <SkeletonRows rows={6} className="p-5" />;
    if (error && jobs.length === 0) {
      return (
        <EmptyState
          className="m-5"
          icon={<RotateCw className="size-5" />}
          title="Couldn’t load applications"
          description={error.message}
          action={<Button variant="secondary" onClick={() => mutate()}>Try again</Button>}
        />
      );
    }
    if (jobs.length === 0) {
      return (
        <EmptyState
          className="m-5"
          icon={<Briefcase className="size-5" />}
          title="No applications yet"
          description="Add your first application to start tracking your pipeline."
          action={<Button icon={<Plus className="size-4" />} onClick={openCreate}>Add application</Button>}
        />
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          className="m-5"
          icon={<SearchX className="size-5" />}
          title="No matches"
          description="No applications match your search or filters."
          action={<Button variant="secondary" onClick={() => updateFilters(EMPTY_FILTERS)}>Clear filters</Button>}
        />
      );
    }
    if (view === 'board') return <JobKanban jobs={visible} onMove={moveToStage} onOpen={handlers.onView} />;
    return view === 'table' ? (
      <>
        <div className="hidden md:block">
          <JobTable jobs={pageJobs} sort={sort} onSort={toggleSort} {...handlers} />
        </div>
        <CardGrid className="md:hidden" jobs={pageJobs} handlers={handlers} />
      </>
    ) : (
      <CardGrid jobs={pageJobs} handlers={handlers} />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Every application, its stage and what happens next."
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
            <Button
              variant="secondary"
              icon={<Download className="size-4" />}
              disabled={visible.length === 0}
              onClick={() => downloadCsv(`applications-${toDateKey(new Date())}.csv`, jobsToCsv(visible))}
              title="Download the applications currently shown as CSV"
            >
              Export CSV
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={openCreate}>
              Add application
            </Button>
          </>
        }
      />

      <Card accent="sky">
        <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900 tabular-nums">{visible.length}</span>
              {visible.length !== jobs.length && <> of {jobs.length}</>} applications
            </p>
            <SegmentedControl
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table', icon: <List className="size-4" /> },
                { value: 'cards', label: 'Cards', icon: <LayoutGrid className="size-4" /> },
                { value: 'board', label: 'Board', icon: <Columns3 className="size-4" /> },
              ]}
            />
          </div>
          <TrackerFilters
            filters={filters}
            onChange={updateFilters}
            onClear={() => updateFilters(EMPTY_FILTERS)}
            provinces={options.provinces}
            positions={options.positions}
          />
        </div>
        {renderContent()}
        {view !== 'board' && <Pagination page={currentPage} pageSize={PAGE_SIZE} total={visible.length} onPageChange={setPage} />}
      </Card>

      {dialogs}
    </div>
  );
}

function CardGrid({ jobs, handlers, className }: { jobs: Job[]; handlers: JobActionHandlers; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5', className)}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} {...handlers} />
      ))}
    </div>
  );
}
