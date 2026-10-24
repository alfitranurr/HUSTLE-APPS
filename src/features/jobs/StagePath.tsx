import { ArrowRight, Check, X } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import { parseDate } from '@/lib/format';
import { missingEarlierDates, stagePath } from '@/lib/stats';
import type { Job } from '@/lib/types';

const shortDate = (value: string) =>
  parseDate(value)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';

/**
 * An application's journey on one line: Applied 5 Jul 2026 → HR Interview
 * 12 Jul 2026 → User Interview → Failed. Only stages it went through (same
 * rule as Insights), so a gap means a skipped step or a missing date.
 */
export function StagePath({ job }: { job: Job }) {
  const path = stagePath(job);
  const ended = job.status === 'Failed' || job.status === 'Success';

  return (
    <span className="block">
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        {path.map((step, i) => (
          <Fragment key={step.stage}>
            {i > 0 && <ArrowRight aria-hidden className="size-3 shrink-0 text-slate-300" />}
            <span className={cn('whitespace-nowrap', step.current ? 'font-semibold text-slate-800' : 'text-slate-600')}>
              {step.label}
              {step.date && <span className="ml-1 font-normal text-slate-400">{shortDate(step.date)}</span>}
            </span>
          </Fragment>
        ))}
        {ended && (
          <>
            <ArrowRight aria-hidden className="size-3 shrink-0 text-slate-300" />
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold whitespace-nowrap',
                job.status === 'Failed' ? 'text-rose-600' : 'text-emerald-600'
              )}
            >
              {job.status === 'Failed' ? <X className="size-3" /> : <Check className="size-3" />}
              {job.status}
            </span>
          </>
        )}
      </span>
      {missingEarlierDates(job) && (
        <span className="mt-0.5 block text-[11px] text-amber-700">
          Earlier stages have no date. If you went through them, add their dates in Edit.
        </span>
      )}
    </span>
  );
}
