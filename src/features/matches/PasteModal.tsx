'use client';

import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { parsePastedJobs } from '@/lib/linkedin/parseJobs';
import { importPasted } from './matchApi';

/** LinkedIn's "Top job picks for you" collection. */
const TOP_PICKS_URL = 'https://www.linkedin.com/jobs/collections/recommended/';

/** Copy the "Top job picks for you" page, paste it here, check the preview, import. */
export function PasteModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const jobs = useMemo(() => (text.trim() ? parsePastedJobs(text) : []), [text]);

  const submit = async () => {
    setSaving(true);
    try {
      const { found, added } = await importPasted(text);
      toast.success(added > 0 ? `${added} new ${added === 1 ? 'job' : 'jobs'} added (${found - added} already in your list).` : 'All of these are already in your list.');
      onImported();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      accent="violet"
      dismissible={!saving}
      title="Paste from LinkedIn"
      description="Bring in the jobs on your LinkedIn home page exactly as LinkedIn shows them to you."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={jobs.length === 0}>
            Import {jobs.length > 0 ? jobs.length : ''} {jobs.length === 1 ? 'job' : 'jobs'}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>
              Open{' '}
              <a href={TOP_PICKS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500">
                Top job picks for you <ExternalLink className="size-3.5" />
              </a>{' '}
              (or Jobs on LinkedIn).
            </li>
            <li>
              Scroll the list so the jobs load, then press <kbd className="rounded border border-slate-300 px-1 text-xs">Ctrl</kbd>+
              <kbd className="rounded border border-slate-300 px-1 text-xs">A</kbd> and{' '}
              <kbd className="rounded border border-slate-300 px-1 text-xs">Ctrl</kbd>+<kbd className="rounded border border-slate-300 px-1 text-xs">C</kbd>.
            </li>
            <li>Paste below. Only the job cards are kept; everything else on the page is ignored.</li>
          </ol>
          <Field label="Copied page">
            <Textarea data-autofocus rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the whole page here…" />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Preview {text.trim() && <span className="font-normal text-slate-500">· {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found</span>}
          </p>
          {jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              {text.trim() ? 'No job cards found yet. Copy the whole page, including the job list.' : 'Jobs appear here as soon as you paste.'}
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {jobs.map((job) => (
                <li key={job.id} className="px-4 py-2.5">
                  <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">
                    {job.company} · {job.location}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
