'use client';

import { CalendarCheck, CalendarClock } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import {
  CAREER_LEVELS,
  CONTRACT_STAGES,
  JOB_STAGES,
  JOB_STATUSES,
  PLATFORMS,
  SCHEDULED_STAGES,
  type JobStage,
  type JobStatus,
} from '@/lib/constants';
import { toDateInput, toDateTimeLocal } from '@/lib/format';
import type { Job } from '@/lib/types';
import { safeHref } from '@/lib/urls';
import { AttachmentField, validateFiles } from './AttachmentField';
import { saveJob } from './jobApi';
import { useRegions } from './useRegions';

interface FormValues {
  company: string;
  position: string;
  platform: string;
  careerLevel: string;
  status: JobStatus;
  stage: JobStage;
  appliedAt: string;
  scheduledAt: string;
  contractDate: string;
  province: string;
  city: string;
  note: string;
  instagram: string;
  linkedin: string;
  website: string;
  otherLink: string;
}

type Errors = Partial<Record<keyof FormValues | 'files', string>>;

function initialValues(job?: Job | null): FormValues {
  return {
    company: job?.company ?? '',
    position: job?.position ?? '',
    platform: job?.platform || 'LinkedIn',
    careerLevel: job?.careerLevel || 'Not Specified',
    status: job?.status ?? 'In Progress',
    stage: job?.stage ?? 'Document Screening',
    appliedAt: job ? toDateTimeLocal(job.appliedAt) : toDateTimeLocal(new Date().toISOString()),
    scheduledAt: toDateTimeLocal(job?.scheduledAt),
    contractDate: toDateInput(job?.contractDate),
    province: job?.province ?? '',
    city: job?.city ?? '',
    note: job?.note ?? '',
    instagram: job?.links.instagram ?? '',
    linkedin: job?.links.linkedin ?? '',
    website: job?.links.website ?? '',
    otherLink: job?.links.other ?? '',
  };
}

function validate(values: FormValues, files: File[]): Errors {
  const errors: Errors = {};
  if (!values.company.trim()) errors.company = 'Company is required.';
  if (!values.appliedAt) errors.appliedAt = 'Application date is required.';
  if (SCHEDULED_STAGES.includes(values.stage) && !values.scheduledAt) {
    errors.scheduledAt = `Add the date and time of the ${values.stage.toLowerCase()}.`;
  }
  if (values.stage === 'Contract Signed / Done' && !values.contractDate) {
    errors.contractDate = 'Add the contract date.';
  }
  for (const key of ['instagram', 'linkedin', 'website', 'otherLink'] as const) {
    if (values[key].trim() && !safeHref(values[key])) errors[key] = 'Enter a valid link.';
  }
  const fileError = validateFiles(files);
  if (fileError) errors.files = fileError;
  return errors;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span aria-hidden className="h-3 w-1 rounded-full bg-indigo-500" />
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

interface JobFormModalProps {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
}

export function JobFormModal({ open, job, onClose, onSaved }: JobFormModalProps) {
  const toast = useToast();
  const [values, setValues] = useState(() => initialValues(job));
  const [keptAttachments, setKeptAttachments] = useState<string[]>(job?.attachments ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const regions = useRegions(values.province);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const needsSchedule = SCHEDULED_STAGES.includes(values.stage);
  const needsContract = CONTRACT_STAGES.includes(values.stage);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values, files);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value);
    if (!needsSchedule) form.set('scheduledAt', '');
    if (!needsContract) form.set('contractDate', '');
    keptAttachments.forEach((url) => form.append('keepAttachments', url));
    files.forEach((file) => form.append('files', file));

    setSaving(true);
    try {
      await saveJob(form, job?.id);
      toast.success(job ? 'Application updated.' : 'Application added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      dismissible={!saving}
      title={job ? `Edit ${job.company}` : 'New application'}
      description="Fields marked * are required."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="job-form" loading={saving}>
            {job ? 'Save changes' : 'Add application'}
          </Button>
        </>
      }
    >
      <form id="job-form" onSubmit={handleSubmit} noValidate className="grid gap-8 md:grid-cols-2">
        <Section title="Role">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" required error={errors.company}>
              <Input
                data-autofocus
                value={values.company}
                onChange={(e) => set('company', e.target.value)}
                aria-invalid={Boolean(errors.company)}
                maxLength={200}
              />
            </Field>
            <Field label="Position">
              <Input
                value={values.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="e.g. Frontend Engineer"
                maxLength={200}
              />
            </Field>
            <Field label="Platform" required>
              <Select options={PLATFORMS} value={values.platform} onChange={(e) => set('platform', e.target.value)} />
            </Field>
            <Field label="Career level">
              <Select options={CAREER_LEVELS} value={values.careerLevel} onChange={(e) => set('careerLevel', e.target.value)} />
            </Field>
            <Field label="Status" required>
              <Select
                options={JOB_STATUSES}
                value={values.status}
                onChange={(e) => set('status', e.target.value as JobStatus)}
              />
            </Field>
            <Field label="Current stage" required>
              <Select options={JOB_STAGES} value={values.stage} onChange={(e) => set('stage', e.target.value as JobStage)} />
            </Field>
            <Field label="Applied on" required error={errors.appliedAt}>
              <Input
                type="datetime-local"
                value={values.appliedAt}
                onChange={(e) => set('appliedAt', e.target.value)}
                aria-invalid={Boolean(errors.appliedAt)}
              />
            </Field>
            {needsSchedule && (
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-violet-500" />
                    {values.stage === 'Assessment Test' ? 'Test schedule' : 'Interview schedule'}
                  </span>
                }
                required
                error={errors.scheduledAt}
              >
                <Input
                  type="datetime-local"
                  value={values.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                  aria-invalid={Boolean(errors.scheduledAt)}
                />
              </Field>
            )}
            {needsContract && (
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck className="size-4 text-emerald-600" />
                    Contract date
                  </span>
                }
                required={values.stage === 'Contract Signed / Done'}
                hint={values.stage === 'Offering Letter' ? 'Planned contract / start date, if known' : undefined}
                error={errors.contractDate}
              >
                <Input
                  type="date"
                  value={values.contractDate}
                  onChange={(e) => set('contractDate', e.target.value)}
                  aria-invalid={Boolean(errors.contractDate)}
                />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Province" hint={regions.loading ? 'Loading regions…' : undefined}>
              <Input
                list="province-options"
                value={values.province}
                onChange={(e) => setValues((v) => ({ ...v, province: e.target.value, city: '' }))}
                placeholder="Search province"
              />
              <datalist id="province-options">
                {regions.provinces.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>
            <Field label="City">
              <Input
                list="city-options"
                value={values.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder={values.province ? 'Search city' : 'Pick a province first'}
              />
              <datalist id="city-options">
                {regions.cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['linkedin', 'LinkedIn', 'linkedin.com/company/…'],
                ['website', 'Website / job post', 'careers.company.com'],
                ['instagram', 'Instagram', 'instagram.com/…'],
                ['otherLink', 'Other link', 'https://…'],
              ] as const
            ).map(([key, label, placeholder]) => (
              <Field key={key} label={label} error={errors[key]}>
                <Input
                  type="url"
                  inputMode="url"
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  aria-invalid={Boolean(errors[key])}
                />
              </Field>
            ))}
          </div>
          <Field label="Notes" hint="Salary range, recruiter name, next steps…">
            <Textarea rows={4} value={values.note} onChange={(e) => set('note', e.target.value)} maxLength={5000} />
          </Field>
          <AttachmentField
            existing={keptAttachments}
            onRemoveExisting={(url) => setKeptAttachments((list) => list.filter((u) => u !== url))}
            files={files}
            onFilesChange={(next) => {
              setFiles(next);
              setErrors((e) => ({ ...e, files: validateFiles(next) ?? undefined }));
            }}
            error={errors.files}
            disabled={saving}
          />
        </Section>
      </form>
    </Modal>
  );
}
