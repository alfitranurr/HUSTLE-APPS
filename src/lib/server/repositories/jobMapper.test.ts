import { describe, expect, it } from 'vitest';
import { jobDataToRow, rowToJob, type JobData, type JobRow } from './jobMapper';

const row: JobRow = {
  id: '11111111-1111-4111-8111-111111111111',
  company: 'Acme',
  position: 'Data Analyst',
  applied_at: '2026-05-02T08:25:00+00:00',
  scheduled_at: null,
  contract_date: null,
  stage_dates: { 'Document Screening': '2026-05-02', Bogus: '2026-05-03' },
  status: 'In Progress',
  stage: 'Document Screening',
  platform: 'LinkedIn',
  career_level: 'Entry',
  province: 'DKI Jakarta',
  city: 'Jakarta Selatan',
  note: 'Referral',
  link_instagram: '',
  link_linkedin: 'https://linkedin.com/jobs/view/1',
  link_website: '',
  link_other: '',
  created_at: '2026-05-02T08:30:00+00:00',
  updated_at: '2026-05-03T01:00:00+00:00',
  job_attachments: [
    { id: 'b', file_name: 'second.pdf', created_at: '2026-05-02T09:00:00+00:00' },
    { id: 'a', file_name: 'first.png', created_at: '2026-05-02T08:40:00+00:00' },
  ],
};

describe('rowToJob', () => {
  const job = rowToJob(row);

  it('shows dates as Jakarta wall-clock text and ISO bookkeeping times', () => {
    expect(job.appliedAt).toBe('2026-05-02T15:25');
    expect(job.scheduledAt).toBe('');
    expect(job.contractDate).toBe('');
    expect(job.createdAt).toBe('2026-05-02T08:30:00.000Z');
    expect(job.updatedAt).toBe('2026-05-03T01:00:00.000Z');
  });

  it('maps columns to the Job shape', () => {
    expect(job.careerLevel).toBe('Entry');
    expect(job.links).toEqual({ instagram: '', linkedin: 'https://linkedin.com/jobs/view/1', website: '', other: '' });
  });

  it('drops unknown stages from stage dates', () => {
    expect(job.stageDates).toEqual({ 'Document Screening': '2026-05-02' });
  });

  it('lists attachments oldest first with an app URL, never a storage path', () => {
    expect(job.attachments).toEqual([
      { id: 'a', name: 'first.png', url: '/api/attachments/a' },
      { id: 'b', name: 'second.pdf', url: '/api/attachments/b' },
    ]);
  });
});

describe('jobDataToRow', () => {
  const data: JobData = {
    company: 'Acme',
    position: 'Data Analyst',
    appliedAt: '2026-05-02T15:25',
    scheduledAt: '2026-05-10 09:00',
    contractDate: '2026-07-01',
    stageDates: {},
    status: 'In Progress',
    stage: 'HR Interview',
    platform: 'LinkedIn',
    careerLevel: '',
    province: '',
    city: '',
    note: '',
    links: { instagram: '', linkedin: '', website: 'https://acme.com', other: '' },
  };

  it('stores Jakarta times with their offset and the contract date as a date', () => {
    const out = jobDataToRow(data);
    expect(out.applied_at).toBe('2026-05-02T15:25:00+07:00');
    expect(out.scheduled_at).toBe('2026-05-10T09:00:00+07:00');
    expect(out.contract_date).toBe('2026-07-01');
    expect(out.link_website).toBe('https://acme.com');
  });

  it('never carries identity or ownership columns', () => {
    const out = jobDataToRow(data) as Record<string, unknown>;
    for (const key of ['id', 'user_id', 'created_at', 'updated_at', 'legacy_id']) expect(out).not.toHaveProperty(key);
  });

  it('empty optional dates become null', () => {
    const out = jobDataToRow({ ...data, scheduledAt: '', contractDate: '' });
    expect(out.scheduled_at).toBeNull();
    expect(out.contract_date).toBeNull();
  });

  it('round-trips through rowToJob', () => {
    const out = jobDataToRow(data);
    const back = rowToJob({ ...row, ...out, stage_dates: {}, job_attachments: [] });
    expect(back.appliedAt).toBe(data.appliedAt);
    expect(back.scheduledAt).toBe('2026-05-10T09:00');
    expect(back.contractDate).toBe(data.contractDate);
  });
});
