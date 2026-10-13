'use client';

import { Wrench } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Job } from '@/lib/types';

/** Applications marked In Progress while their stage still says Not Started. */
export function stageMismatches(jobs: Job[]): Job[] {
  return jobs.filter((job) => job.status === 'In Progress' && job.stage === 'Not Started');
}

interface StageFixBannerProps {
  jobs: Job[];
  busy: boolean;
  onFix: (ids: string[]) => Promise<void>;
}

/**
 * Data clean-up prompt: an application that is "In Progress" has been sent,
 * so its stage should be at least Document Screening.
 */
export function StageFixBanner({ jobs, busy, onFix }: StageFixBannerProps) {
  const [confirming, setConfirming] = useState(false);
  const mismatched = stageMismatches(jobs);
  if (mismatched.length === 0) return null;
  const n = mismatched.length;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-amber-900">
          <Wrench className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            <strong className="font-semibold">{n} applications</strong> are In Progress but their stage is still “Not
            Started”, which skews the pipeline and the board.
          </span>
        </p>
        <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setConfirming(true)}>
          Move to Document Screening
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        variant="primary"
        title={`Fix ${n} applications?`}
        description="Their stage becomes Document Screening, dated with each application’s applied date. Status, notes and everything else stay as they are."
        confirmLabel={`Fix ${n}`}
        loading={busy}
        onConfirm={async () => {
          await onFix(mismatched.map((job) => job.id));
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      >
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          {mismatched.map((job) => (
            <li key={job.id} className="truncate">
              <span className="font-medium text-slate-800">{job.company}</span>
              {job.position && ` · ${job.position}`}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
