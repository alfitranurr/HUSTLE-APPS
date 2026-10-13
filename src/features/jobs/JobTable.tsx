import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Badge, StageBadge, StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { STATUS_TONE } from '@/lib/constants';
import { needsFollowUp } from '@/lib/followUp';
import { formatDate, formatLocation } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';
import type { SortKey, SortState } from './filters';
import { JobActions, type JobActionHandlers } from './JobActions';
import { JobLinkIcons } from './JobLinks';

interface JobTableProps extends JobActionHandlers {
  jobs: Job[];
  sort: SortState;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKey, sort, onSort, className }: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={cn('px-3 py-3', className)} aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('inline-flex cursor-pointer items-center gap-1 hover:text-slate-900', active && 'text-slate-900')}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </th>
  );
}

export function JobTable({ jobs, sort, onSort, ...actions }: JobTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
          <tr>
            <SortHeader label="Company" sortKey="company" sort={sort} onSort={onSort} className="pl-5" />
            <th scope="col" className="px-3 py-3">Location</th>
            <th scope="col" className="px-3 py-3">Platform</th>
            <SortHeader label="Stage" sortKey="stage" sort={sort} onSort={onSort} />
            <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <SortHeader label="Applied" sortKey="appliedAt" sort={sort} onSort={onSort} />
            <th scope="col" className="px-3 py-3 pr-5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <tr key={job.id} className="transition-colors hover:bg-slate-50/70">
              <td className={cn('border-l-4 py-3 pr-3 pl-4', TONES[STATUS_TONE[job.status]].edge)}>
                <button
                  type="button"
                  onClick={() => actions.onView(job)}
                  className="cursor-pointer text-left font-semibold text-slate-900 hover:text-indigo-600"
                >
                  {job.company}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{job.position || '—'}</span>
                  <JobLinkIcons job={job} className="-my-1" />
                </div>
              </td>
              <td className="max-w-[200px] truncate px-3 py-3 text-slate-600" title={formatLocation(job)}>
                {formatLocation(job)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-600">{job.platform || '—'}</td>
              <td className="px-3 py-3">
                <StageBadge stage={job.stage} />
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={job.status} />
                  {needsFollowUp(job) && <Badge tone="amber">Follow up</Badge>}
                </div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-600 tabular-nums">{formatDate(job.appliedAt)}</td>
              <td className="py-2 pr-4 pl-3">
                <div className="flex justify-end">
                  <JobActions job={job} {...actions} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
