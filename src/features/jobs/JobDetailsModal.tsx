'use client';

import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { PlatformBrandIcon } from '@/components/BrandIcons';
import { StageBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CONTRACT_STAGES, SCHEDULED_STAGES, STATUS_TONE } from '@/lib/constants';
import { formatDate, formatDateTime, formatLocation, formatRelative } from '@/lib/format';
import type { Job } from '@/lib/types';
import { AttachmentLinks, JobLinkButtons } from './JobLinks';
import { StageStepper } from './StageStepper';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
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
          <Button icon={<Pencil className="size-4" />} onClick={() => onEdit(job)}>
            Edit
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          <StageBadge stage={job.stage} />
        </div>

        <div className="rounded-xl border border-slate-200 px-3 py-4">
          <StageStepper stage={job.stage} status={job.status} />
        </div>

        {CONTRACT_STAGES.includes(job.stage) && job.contractDate && (
          <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-semibold text-emerald-900">Contract date · {formatDate(job.contractDate)}</p>
            <p className="text-emerald-700">{formatRelative(job.contractDate)}</p>
          </div>
        )}

        {showSchedule && (
          <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 px-4 py-3 text-sm">
            <p className="font-semibold text-violet-900">
              {job.stage === 'Assessment Test' ? 'Assessment' : 'Interview'} · {formatDateTime(job.scheduledAt)}
            </p>
            <p className="text-violet-700">{formatRelative(job.scheduledAt)}</p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Item label="Applied">{formatDate(job.appliedAt)}</Item>
          <Item label="Platform">
            <span className="inline-flex items-center gap-1.5">
              <PlatformBrandIcon platform={job.platform} className="size-4" />
              {job.platform || '—'}
            </span>
          </Item>
          <Item label="Career level">{job.careerLevel || '—'}</Item>
          <Item label="Location">{formatLocation(job)}</Item>
          <Item label="Last updated">{formatDate(job.updatedAt)}</Item>
        </dl>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-xs font-medium text-slate-500">Links</h3>
            <JobLinkButtons job={job} />
          </section>
          <section>
            <h3 className="mb-2 text-xs font-medium text-slate-500">Attachments</h3>
            <AttachmentLinks urls={job.attachments} />
          </section>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-medium text-slate-500">Notes</h3>
          {job.note ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700">{job.note}</p>
          ) : (
            <p className="text-sm text-slate-500">No notes yet.</p>
          )}
        </section>
      </div>
    </Modal>
  );
}
