import { describe, expect, it } from 'vitest';
import { selectReached } from '@/features/jobs/selection';
import {
  computeJobStats,
  missingEarlierDates,
  mostCommonStop,
  pipelineFunnel,
  reachedInterview,
  reachedStage,
  rejectionPoints,
  stagePath,
} from './stats';
import type { Job, JobStage, JobStatus } from './types';
import type { StageDates } from './stageDates';

let next = 0;
function job(stage: JobStage, status: JobStatus = 'In Progress', stageDates: StageDates = {}): Job {
  next += 1;
  return {
    id: String(next),
    company: `Company ${next}`,
    position: 'Analyst',
    appliedAt: '2026-05-01T09:00',
    scheduledAt: '',
    contractDate: '',
    stageDates,
    status,
    stage,
    platform: 'LinkedIn',
    careerLevel: '',
    province: '',
    city: '',
    note: '',
    links: { instagram: '', linkedin: '', website: '', other: '' },
    attachments: [],
    createdAt: '2026-05-01T02:00:00.000Z',
    updatedAt: '2026-05-01T02:00:00.000Z',
  };
}

describe('reachedStage: a stage counts only with evidence', () => {
  // A signed contract with only that date recorded and no FGD/LGD (a real case from the migrated data).
  const signed = job('Contract Signed / Done', 'Success', { 'Contract Signed / Done': '2026-10-14' });

  it('counts the current stage', () => {
    expect(reachedStage(signed, 'Contract Signed / Done')).toBe(true);
  });

  it('does not assume the stages in between', () => {
    for (const stage of ['Document Screening', 'Assessment Test', 'HR Interview', 'User Interview', 'FGD/LGD', 'Offering Letter'] as const) {
      expect(reachedStage(signed, stage), stage).toBe(false);
    }
  });

  it('counts a stage that has a date even after moving on', () => {
    const withHistory = job('Offering Letter', 'Success', { 'HR Interview': '2026-07-01', 'Offering Letter': '2026-07-20' });
    expect(reachedStage(withHistory, 'HR Interview')).toBe(true);
    expect(reachedStage(withHistory, 'User Interview')).toBe(false);
    expect(reachedStage(withHistory, 'FGD/LGD')).toBe(false);
  });

  it('counts every application as applied', () => {
    expect(reachedStage(job('Not Started'), 'Not Started')).toBe(true);
    expect(reachedStage(signed, 'Not Started')).toBe(true);
  });
});

describe('reachedInterview uses the same rule', () => {
  it('needs an HR, user or FGD/LGD interview, not just a later stage', () => {
    expect(reachedInterview(job('Offering Letter', 'Success', { 'Offering Letter': '2026-10-14' }))).toBe(false);
    expect(reachedInterview(job('Offering Letter', 'Success', { 'User Interview': '2026-07-01' }))).toBe(true);
    expect(reachedInterview(job('HR Interview', 'Failed'))).toBe(true);
    expect(reachedInterview(job('Document Screening'))).toBe(false);
  });

  it('drives the Interviews stat card', () => {
    const stats = computeJobStats([job('HR Interview'), job('Offering Letter', 'Success'), job('Document Screening'), job('Not Started')]);
    expect(stats.interviews).toBe(1);
    expect(stats.interviewRate).toBe(25);
  });
});

describe('pipelineFunnel', () => {
  const jobs = [
    job('Not Started'),
    job('Document Screening'),
    job('Document Screening'),
    job('HR Interview', 'Failed', { 'Document Screening': '2026-05-03', 'HR Interview': '2026-05-10' }),
    job('Contract Signed / Done', 'Success', { 'Contract Signed / Done': '2026-10-14' }),
  ];
  const steps = pipelineFunnel(jobs);
  const at = (stage: JobStage) => steps.find((s) => s.stage === stage)!;

  it('counts each stage independently and as a share of all applications', () => {
    expect(at('Not Started').reached).toBe(5);
    expect(at('Document Screening').reached).toBe(3);
    expect(at('Document Screening').ofTotal).toBe(60);
    expect(at('Assessment Test').reached).toBe(0);
    expect(at('HR Interview').reached).toBe(1);
    expect(at('FGD/LGD').reached).toBe(0);
    expect(at('Contract Signed / Done').reached).toBe(1);
  });

  it('matches the drill-down list behind each row', () => {
    for (const step of steps) {
      expect(jobs.filter(selectReached(step.stage).match).length, step.stage).toBe(step.reached);
    }
  });

  it('uses the same rule for "where you get rejected"', () => {
    const hr = rejectionPoints(jobs).find((p) => p.stage === 'HR Interview')!;
    expect(hr).toMatchObject({ rejected: 1, reached: 1, rate: 100 });
  });
});

describe('mostCommonStop', () => {
  it('names the stage most applications end up at, ignoring tiny groups', () => {
    const jobs = [
      ...Array.from({ length: 6 }, () => job('Document Screening')),
      ...Array.from({ length: 3 }, () => job('Assessment Test', 'Failed')),
      ...Array.from({ length: 10 }, () => job('Not Started')),
    ];
    expect(mostCommonStop(jobs)).toMatchObject({ stage: 'Document Screening', count: 6 });
    expect(mostCommonStop(jobs.filter((j) => j.stage !== 'Document Screening'))).toBeNull();
  });
});

describe('stagePath', () => {
  it('lists only the stages gone through, in order, with their dates', () => {
    const j = job('User Interview', 'Failed', { 'HR Interview': '2026-07-12', 'User Interview': '2026-07-20' });
    expect(stagePath(j).map((s) => [s.label, s.date, s.current])).toEqual([
      ['Applied', '2026-05-01T09:00', false],
      ['HR Interview', '2026-07-12', false],
      ['User Interview', '2026-07-20', true],
    ]);
    expect(missingEarlierDates(j)).toBe(false);
  });

  it('flags old applications whose earlier stages have no dates', () => {
    const j = job('User Interview', 'Failed');
    expect(stagePath(j).map((s) => s.label)).toEqual(['Applied', 'User Interview']);
    expect(missingEarlierDates(j)).toBe(true);
    expect(missingEarlierDates(job('Document Screening'))).toBe(false);
  });
});
