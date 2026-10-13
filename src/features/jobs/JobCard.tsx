import { CalendarDays, MapPin } from 'lucide-react';
import { PlatformBrandIcon } from '@/components/BrandIcons';
import { StageBadge, StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { STATUS_TONE } from '@/lib/constants';
import { formatDate, formatLocation } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';
import { JobActions, type JobActionHandlers } from './JobActions';
import { AttachmentLinks, JobLinkIcons } from './JobLinks';

export function JobCard({ job, ...actions }: JobActionHandlers & { job: Job }) {
  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        TONES[STATUS_TONE[job.status]].edge
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => actions.onView(job)}
            className="block max-w-full cursor-pointer truncate text-left text-base font-semibold text-slate-900 hover:text-indigo-600"
          >
            {job.company}
          </button>
          <p className="truncate text-sm text-slate-500">{job.position || 'Position not set'}</p>
        </div>
        <StatusBadge status={job.status} />
      </header>

      <div className="flex flex-wrap gap-1.5">
        <StageBadge stage={job.stage} />
        {job.careerLevel && job.careerLevel !== 'Not Specified' && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{job.careerLevel}</span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
          <dt className="sr-only">Applied</dt>
          <dd>{formatDate(job.appliedAt)}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <PlatformBrandIcon platform={job.platform} className="size-3.5 shrink-0" />
          <dt className="sr-only">Platform</dt>
          <dd className="truncate">{job.platform || 'Other'}</dd>
        </div>
        <div className="col-span-2 flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-slate-400" />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">{formatLocation(job)}</dd>
        </div>
      </dl>

      {job.note && <p className="line-clamp-2 text-xs text-slate-500">{job.note}</p>}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <JobLinkIcons job={job} />
          <AttachmentLinks urls={job.attachments} compact />
        </div>
        <JobActions job={job} {...actions} />
      </footer>
    </article>
  );
}
