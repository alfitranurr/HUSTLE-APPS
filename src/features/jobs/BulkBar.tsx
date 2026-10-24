'use client';

import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface BulkBarProps {
  count: number;
  busy: boolean;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * Floating bar while rows are selected. Delete is the only bulk action;
 * every other change goes through the Edit button of one application.
 */
export function BulkBar({ count, busy, onDelete, onClear }: BulkBarProps) {
  const [confirming, setConfirming] = useState(false);
  const plural = count === 1 ? 'application' : 'applications';

  return (
    <>
      <div
        role="region"
        aria-label="Bulk actions"
        className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-sm items-center gap-2 rounded-xl bg-slate-900 py-2.5 pr-2 pl-4 text-white shadow-2xl animate-fade-in"
      >
        <span className="mr-auto text-sm font-semibold tabular-nums">{count} selected</span>
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
          icon={<Trash2 className="size-3.5" />}
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
        <IconButton
          label="Clear selection"
          icon={<X className="size-4" />}
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={onClear}
          disabled={busy}
        />
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${count} ${plural}?`}
        description={`The selected ${plural} and their attachments will be removed. This can’t be undone.`}
        confirmLabel={`Delete ${count}`}
        loading={busy}
        onConfirm={() => {
          onDelete();
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
