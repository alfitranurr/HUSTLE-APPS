'use client';

import { BellOff, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { JOB_STAGES, JOB_STATUSES, type JobStage, type JobStatus } from '@/lib/constants';

interface BulkBarProps {
  count: number;
  busy: boolean;
  onSetStatus: (status: JobStatus) => void;
  onSetStage: (stage: JobStage) => void;
  onDelete: () => void;
  onClear: () => void;
}

const SELECT =
  'h-8 cursor-pointer rounded-lg border-0 bg-white/10 px-2.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none';

/** Floating action bar shown while rows are selected. */
export function BulkBar({ count, busy, onSetStatus, onSetStage, onDelete, onClear }: BulkBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const plural = count === 1 ? 'application' : 'applications';

  return (
    <>
      <div
        role="region"
        aria-label="Bulk actions"
        className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl animate-fade-in sm:inset-x-6"
      >
        <span className="mr-1 text-sm font-semibold tabular-nums">
          {count} selected
        </span>
        <select
          aria-label="Set status for selected"
          className={SELECT}
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && onSetStatus(e.target.value as JobStatus)}
        >
          <option value="" className="text-slate-900">
            Set status…
          </option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s} className="text-slate-900">
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Set stage for selected"
          className={SELECT}
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && onSetStage(e.target.value as JobStage)}
        >
          <option value="" className="text-slate-900">
            Set stage…
          </option>
          {JOB_STAGES.map((s) => (
            <option key={s} value={s} className="text-slate-900">
              {s}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
          icon={<BellOff className="size-3.5" />}
          disabled={busy}
          onClick={() => onSetStatus('No Response')}
        >
          No response
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
          icon={<Trash2 className="size-3.5" />}
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
        <IconButton
          label="Clear selection"
          icon={<X className="size-4" />}
          className="ml-auto text-white hover:bg-white/10 hover:text-white"
          onClick={onClear}
          disabled={busy}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${count} ${plural}?`}
        description={`The selected ${plural} and their attachments in Google Drive will be removed. This can’t be undone.`}
        confirmLabel={`Delete ${count}`}
        loading={busy}
        onConfirm={() => {
          onDelete();
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
