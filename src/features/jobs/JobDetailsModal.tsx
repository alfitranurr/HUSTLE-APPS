'use client';

import { CalendarCheck, CalendarClock, MessagesSquare, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PlatformBrandIcon } from '@/components/BrandIcons';
import { Badge, StageBadge, StatusBadge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CONTRACT_STAGES, PREP_STAGES, SCHEDULED_STAGES, STATUS_TONE } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { needsFollowUp } from '@/lib/followUp';
import { formatDate, formatDateTime, formatLocation, formatRelative } from '@/lib/format';
import { isActive } from '@/lib/stats';
import type { Job } from '@/lib/types';
import { AttachmentList, JobLinkList } from './JobLinks';
import { NoteList } from './NoteList';
import { StageTimeline } from './StageTimeline';

/** Bordered card with a small uppercase heading; every section of the popup uses it. */
function Panel({ title, count, children, className }: { title: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.6875rem] text-slate-600 tabular-nums">{count}</span>
        )}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function Highlight({ tone, icon, title, subtitle }: { tone: 'violet' | 'emerald'; icon: ReactNode; title: string; subtitle: string }) {
  const styles = {
    violet: 'border-violet-500 bg-violet-50 text-violet-900',
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  }[tone];
  return (
    <div className={`flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 ${styles}`}>
      {icon}
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        <p className="opacity-80">{subtitle}</p>
      </div>
    </div>
  );
}

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onEdit: (job: Job) => void;
}

export function JobDetailsModal({ job, onClose, onEdit }: JobDetailsModalProps) {
  if (!job) return null;
  const showSchedule = SCHEDULED_STAGES.includes(job.stage) && job.scheduledAt;
  const showContract = CONTRACT_STAGES.includes(job.stage) && job.contractDate;
  const showPrep = isActive(job) && PREP_STAGES.includes(job.stage);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      accent={STATUS_TONE[job.status]}
      title={job.company}
      description={job.position || 'Position not set'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {showPrep && (
            <Link
              href={`/interviews?company=${encodeURIComponent(job.company)}`}
              onClick={onClose}
              className={buttonClasses('secondary')}
            >
              <MessagesSquare className="size-4" />
              Interview prep
            </Link>
          )}
          <Button icon={<Pencil className="size-4" />} onClick={() => onEdit(job)}>
            Edit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          <StageBadge stage={job.stage} />
          {needsFollowUp(job) && <Badge tone="amber">Follow up</Badge>}
        </div>

        <Panel title="Progress">
          <div className="pt-1">
            <StageTimeline job={job} />
          </div>
        </Panel>

        {(showSchedule || showContract) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {showSchedule && (
              <Highlight
                tone="violet"
                icon={<CalendarClock className="size-5 shrink-0 text-violet-500" />}
                title={`${job.stage === 'Assessment Test' ? 'Assessment' : 'Interview'} · ${formatDateTime(job.scheduledAt)}`}
                subtitle={formatRelative(job.scheduledAt)}
              />
            )}
            {showContract && (
              <Highlight
                tone="emerald"
                icon={<CalendarCheck className="size-5 shrink-0 text-emerald-600" />}
                title={`Contract · ${formatDate(job.contractDate)}`}
                subtitle={formatRelative(job.contractDate)}
              />
            )}
          </div>
        )}

        {/* Notes get the full width: they are the longest and most-read part. */}
        <Panel title="Notes">
          {job.note ? <NoteList note={job.note} /> : <p className="text-sm text-slate-400">No notes yet.</p>}
        </Panel>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Panel title="Details">
            <dl className="-my-2.5 divide-y divide-slate-100">
              <Row label="Applied">{formatDate(job.appliedAt)}</Row>
              <Row label="Platform">
                <span className="inline-flex items-center gap-1.5">
                  <PlatformBrandIcon platform={job.platform} className="size-4" />
                  {job.platform || '—'}
                </span>
              </Row>
              <Row label="Career level">{job.careerLevel || '—'}</Row>
              <Row label="Location">{formatLocation(job)}</Row>
              {job.contractDate && <Row label="Contract date">{formatDate(job.contractDate)}</Row>}
              <Row label="Last updated">{formatDate(job.updatedAt)}</Row>
            </dl>
          </Panel>
          <Panel title="Links" count={Object.values(job.links).filter(Boolean).length}>
            <JobLinkList job={job} />
          </Panel>
          <Panel title="Attachments" count={job.attachments.length}>
            <AttachmentList urls={job.attachments} />
          </Panel>
        </div>
      </div>
    </Modal>
  );
}
