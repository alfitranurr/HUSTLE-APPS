'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { Job } from '@/lib/types';
import { deleteJob } from './jobApi';
import type { JobActionHandlers } from './JobActions';
import { JobDetailsModal } from './JobDetailsModal';
import { JobFormModal, type JobFormDefaults } from './JobFormModal';

/**
 * Owns the add / edit / view / delete dialogs for applications so every page
 * that lists jobs gets the same behaviour. `onChanged` should revalidate data.
 */
export function useJobDialogs(onChanged: () => unknown) {
  const toast = useToast();
  // A fresh key per opening resets the form state without effects.
  const [form, setForm] = useState<{
    job: Job | null;
    key: number;
    defaults?: JobFormDefaults;
    onCreated?: () => void;
  } | null>(null);
  const [viewing, setViewing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => setForm({ job: null, key: Date.now() });
  /** New application with prefilled fields; `onCreated` runs after it saves. */
  const openCreateWith = (defaults: JobFormDefaults, onCreated?: () => void) =>
    setForm({ job: null, key: Date.now(), defaults, onCreated });
  const openEdit = (job: Job) => {
    setViewing(null);
    setForm({ job, key: Date.now() });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteJob(deleting.id);
      toast.success(`${deleting.company} deleted.`);
      setDeleting(null);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handlers: JobActionHandlers = { onView: setViewing, onEdit: openEdit, onDelete: setDeleting };

  const dialogs = (
    <>
      {form && (
        <JobFormModal
          key={form.key}
          open
          job={form.job}
          defaults={form.defaults}
          onClose={() => setForm(null)}
          onSaved={() => {
            form.onCreated?.();
            void onChanged();
          }}
        />
      )}
      <JobDetailsModal job={viewing} onClose={() => setViewing(null)} onEdit={openEdit} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete application?"
        description={
          <>
            <strong className="font-semibold text-slate-900">{deleting?.company}</strong> and its attachments will be
            removed. This can’t be undone.
          </>
        }
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );

  return { openCreate, openCreateWith, handlers, dialogs };
}
