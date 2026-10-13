'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { STALE_AFTER_DAYS } from '@/lib/constants';
import { daysSinceUpdate, isStale } from '@/lib/followUp';
import type { Job } from '@/lib/types';

interface CloseStaleDialogProps {
  jobs: Job[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

/**
 * Lists every stale open application with a checkbox (all ticked) so you can
 * keep the ones that are still alive before closing the rest as "No Response".
 */
export function CloseStaleDialog({ jobs, busy, onClose, onConfirm }: CloseStaleDialogProps) {
  const stale = useMemo(
    () =>
      jobs
        .filter((job) => isStale(job))
        .map((job) => ({ job, days: daysSinceUpdate(job) ?? 0 }))
        .sort((a, b) => b.days - a.days),
    [jobs]
  );
  const [picked, setPicked] = useState<Set<string>>(() => new Set(stale.map(({ job }) => job.id)));
  const allPicked = picked.size === stale.length;

  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Modal
      open
      onClose={onClose}
      accent="slate"
      dismissible={!busy}
      title={`Close ${stale.length} stale applications`}
      description={`Open applications with no update for ${STALE_AFTER_DAYS}+ days. Untick any that are still in play; the rest get status “No Response” and stop counting as active.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} disabled={picked.size === 0} onClick={() => onConfirm([...picked])}>
            Mark {picked.size} as No Response
          </Button>
        </>
      }
    >
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          <span className="font-semibold text-slate-900 tabular-nums">{picked.size}</span> of {stale.length} selected
        </span>
        <button
          type="button"
          className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500"
          onClick={() => setPicked(allPicked ? new Set() : new Set(stale.map(({ job }) => job.id)))}
        >
          {allPicked ? 'Select none' : 'Select all'}
        </button>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {stale.map(({ job, days }) => (
          <li key={job.id}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
              <input
                type="checkbox"
                className="size-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                checked={picked.has(job.id)}
                onChange={() => toggle(job.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{job.company}</span>
                <span className="block truncate text-xs text-slate-500">
                  {job.position || 'Position not set'} · {job.status}
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-500 tabular-nums">{days} days</span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
