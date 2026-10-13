'use client';

import { ArrowUpRight, Search, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StageBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { STATUS_TONE } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';
import { DEFAULT_SORT, sortJobs } from './filters';
import { selectionHref, type JobSelection } from './selection';

interface JobListModalProps {
  /** Which group to list; null closes the dialog. */
  selection: JobSelection | null;
  /** Jobs to pick from (already narrowed by any page-level timeframe). */
  jobs: Job[];
  /** Extra context under the title, e.g. the active timeframe. */
  context?: string;
  onClose: () => void;
  onOpen: (job: Job) => void;
}

/** "Which companies are behind this number?" — the drill-down for every card. */
export function JobListModal({ selection, jobs, context, onClose, onOpen }: JobListModalProps) {
  const [query, setQuery] = useState('');
  const inGroup = useMemo(() => (selection ? jobs.filter(selection.match) : []), [jobs, selection]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortJobs(inGroup, DEFAULT_SORT).filter(
      (job) => !q || `${job.company} ${job.position}`.toLowerCase().includes(q)
    );
  }, [inGroup, query]);

  if (!selection) return null;
  const total = inGroup.length;
  const href = selectionHref(selection);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      accent={selection.tone}
      title={`${selection.title} · ${total}`}
      description={context ?? 'Newest first. Select a company to see its details.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {href && (
            <Link
              href={href}
              onClick={onClose}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Open in Applications
              <ArrowUpRight className="size-4" />
            </Link>
          )}
        </>
      }
    >
      {total > 6 && (
        <label className="relative mb-4 block">
          <span className="sr-only">Search companies</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          />
          <Input
            data-autofocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or position…"
            className="pl-9"
          />
        </label>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title={total === 0 ? 'No companies in this group yet' : 'No matches'}
          description={total === 0 ? undefined : 'Try a different company or position name.'}
        />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {list.map((job) => (
            <li key={job.id}>
              <button
                type="button"
                onClick={() => onOpen(job)}
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-2 border-l-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between',
                  TONES[STATUS_TONE[job.status]].edge
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">{job.company}</span>
                  <span className="block truncate text-xs text-slate-500">{job.position || 'Position not set'}</span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <StageBadge stage={job.stage} />
                  <StatusBadge status={job.status} />
                  <span className="w-24 text-right text-xs text-slate-500 tabular-nums">
                    {formatDate(job.appliedAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
