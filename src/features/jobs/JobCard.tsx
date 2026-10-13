import { CalendarCheck, CalendarDays, MapPin, Paperclip } from 'lucide-react';
import type { ReactNode } from 'react';
import { PlatformBrandIcon } from '@/components/BrandIcons';
import { Badge, StageBadge, StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { CONTRACT_STAGES, STATUS_TONE } from '@/lib/constants';
import { needsFollowUp } from '@/lib/followUp';
import { formatDate, formatLocation } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';
import { JobActions, type JobActionHandlers } from './JobActions';
import { JobLinkIcons } from './JobLinks';

function Meta({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="truncate" title={typeof children === 'string' ? children : undefined}>
        {children}
      </dd>
    </div>
  );
}

export function JobCard({ job, ...actions }: JobActionHandlers & { job: Job }) {
  const showContract = CONTRACT_STAGES.includes(job.stage) && job.contractDate;
  const level = job.careerLevel && job.careerLevel !== 'Not Specified' ? job.careerLevel : '';

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col rounded-xl border border-l-4 border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        TONES[STATUS_TONE[job.status]].edge
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => actions.onView(job)}
              className="line-clamp-2 min-w-0 cursor-pointer text-left text-base leading-snug font-semibold text-slate-900 hover:text-indigo-600"
            >
              {job.company}
            </button>
            <span className="shrink-0 pt-0.5">
              <StatusBadge status={job.status} />
            </span>
          </div>
          <p className="line-clamp-1 text-sm text-slate-500" title={job.position}>
            {job.position || 'Position not set'}
          </p>
        </header>

        <div className="flex flex-wrap gap-1.5">
          <StageBadge stage={job.stage} />
          {level && <Badge>{level}</Badge>}
          {needsFollowUp(job) && <Badge tone="amber">Follow up</Badge>}
        </div>

        <dl className="space-y-1.5 text-sm text-slate-600">
          <div className="grid grid-cols-2 gap-3">
            <Meta icon={<CalendarDays className="size-4" />} label="Applied">
              {formatDate(job.appliedAt)}
            </Meta>
            <Meta icon={<PlatformBrandIcon platform={job.platform} className="size-4" />} label="Platform">
              {job.platform || 'Other'}
            </Meta>
          </div>
          <Meta icon={<MapPin className="size-4" />} label="Location">
            {formatLocation(job)}
          </Meta>
          {showContract && (
            <Meta icon={<CalendarCheck className="size-4 text-emerald-600" />} label="Contract date">
              Contract {formatDate(job.contractDate)}
            </Meta>
          )}
        </dl>

        {job.note && (
          // Padding lives on the wrapper: on the clamped element it would reveal part of a third line.
          <div className="rounded-lg bg-slate-50 px-3 py-2" title={job.note}>
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{job.note}</p>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
        <div className="-ml-1.5 flex min-w-0 items-center gap-1">
          <JobLinkIcons job={job} />
          {job.attachments.length > 0 && (
            <button
              type="button"
              onClick={() => actions.onView(job)}
              title={`${job.attachments.length} attachment${job.attachments.length > 1 ? 's' : ''}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Paperclip className="size-3" />
              {job.attachments.length}
            </button>
          )}
        </div>
        <JobActions job={job} {...actions} />
      </footer>
    </article>
  );
}
