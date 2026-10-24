import { describe, expect, it } from 'vitest';
import {
  dedupeLegacyIds,
  driveFileId,
  jobColumnIndex,
  JOB_COLUMNS,
  mapJobRow,
  mapQuestionRow,
  mapRecommendationRow,
  normalizeLink,
  normalizeStage,
  normalizeStatus,
  repairText,
  splitAttachmentCell,
  type JobColumn,
} from './legacy';

const collect = () => {
  const list: string[] = [];
  return { list, add: (m: string) => list.push(m) };
};

describe('normalisation of old values', () => {
  it('maps legacy statuses', () => {
    expect(normalizeStatus('Done')).toBe('Success');
    expect(normalizeStatus('progress')).toBe('In Progress');
    expect(normalizeStatus('Psikotes')).toBe('In Progress');
    expect(normalizeStatus('Rejected')).toBe('Failed');
    expect(normalizeStatus('no response')).toBe('No Response');
    expect(normalizeStatus('')).toBe('Not Started');
  });

  it('maps legacy stages', () => {
    expect(normalizeStage('Online Test')).toBe('Assessment Test');
    expect(normalizeStage('psikotes')).toBe('Assessment Test');
    expect(normalizeStage('Presentation Round')).toBe('FGD/LGD');
    expect(normalizeStage('hr interview')).toBe('HR Interview');
    expect(normalizeStage('???')).toBe('Not Started');
  });

  it('reads attachment cells and Drive ids', () => {
    expect(splitAttachmentCell('No File')).toEqual([]);
    expect(splitAttachmentCell('a, b\nc')).toEqual(['a', 'b', 'c']);
    expect(driveFileId('https://drive.google.com/file/d/AbC_12-x/view')).toBe('AbC_12-x');
    expect(driveFileId('https://drive.google.com/open?id=XYZ')).toBe('XYZ');
    expect(driveFileId('https://example.com/file/d/AbC/view')).toBeNull();
  });

  it('normalises links like the form does', () => {
    expect(normalizeLink('linkedin.com/jobs/1')).toBe('https://linkedin.com/jobs/1');
    expect(normalizeLink('')).toBe('');
    expect(normalizeLink('not a link')).toBeNull();
    expect(normalizeLink('javascript:alert(1)')).toBeNull();
  });
});

describe('repairText', () => {
  it('turns the in-word damage back into "done"', () => {
    expect(repairText('PT Vale InIn Progresssia', false)).toBe('PT Vale Indonesia');
    expect(repairText('https://vale.com/in/inIn Progresssia/kerja', false)).toBe('https://vale.com/in/indonesia/kerja');
    expect(repairText('lokerinIn Progresssia-share', false)).toBe('lokerindonesia-share');
  });

  it('restores ticked-off note lines to "Done"', () => {
    expect(repairText('1. In Progress Submission ✅\n2. Masih nunggu', true)).toBe('1. Done Submission ✅\n2. Masih nunggu');
    expect(repairText('2. In Progress Test Psychology ✅', true)).toBe('2. Done Test Psychology ✅');
  });

  it('leaves real "In Progress" text alone', () => {
    expect(repairText('Status In Progress, waiting', true)).toBe('Status In Progress, waiting');
    expect(repairText('In Progress Submission ✅', false)).toBe('In Progress Submission ✅');
  });
});

describe('mapJobRow', () => {
  const header = [...JOB_COLUMNS].map((c) => (c === 'OtherLink' ? 'LinkOther' : c));
  const index = jobColumnIndex(header);
  const rowFrom = (values: Partial<Record<JobColumn, string>>) => {
    const cells = header.map(() => '');
    for (const [k, v] of Object.entries(values)) cells[index.get(k as JobColumn)!] = v!;
    return (c: JobColumn) => cells[index.get(c)!] ?? '';
  };

  it('finds OtherLink under its old "LinkOther" header', () => {
    expect(index.get('OtherLink')).toBe(JOB_COLUMNS.indexOf('OtherLink'));
  });

  it('maps a typical row', () => {
    const issues = collect();
    const job = mapJobRow(
      rowFrom({
        ID: 'ID-1',
        Timestamp: '5/24/2026 7:18:03',
        Company: 'PT Vale InIn Progresssia',
        Status: 'progress',
        CurrentStage: 'Online Test',
        Kategori: 'Intern',
        BuktiURL: 'https://drive.google.com/file/d/F1/view, https://drive.google.com/file/d/F1/view',
        LinkedIn: 'linkedin.com/jobs/view/1',
        Note: '1. In Progress Submission ✅',
        StageDates: '{"Assessment Test":"2026-05-25","Nope":"x"}',
      }),
      2,
      issues
    )!;
    expect(job.legacyId).toBe('ID-1');
    expect(job.row.company).toBe('PT Vale Indonesia');
    expect(job.row.note).toBe('1. Done Submission ✅');
    expect(job.row.applied_at).toBe('2026-05-24T07:18:03+07:00'); // falls back to the Timestamp
    expect(job.row.created_at).toBe('2026-05-24T07:18:03+07:00');
    expect(job.row.status).toBe('In Progress');
    expect(job.row.stage).toBe('Assessment Test');
    expect(job.row.link_linkedin).toBe('https://linkedin.com/jobs/view/1');
    expect(job.row.stage_dates).toEqual({ 'Assessment Test': '2026-05-25' });
    expect(job.driveFiles).toEqual(['F1']);
    expect(issues.list.some((m) => m.includes('repaired'))).toBe(true);
  });

  it('skips rows without a company, like the old app', () => {
    expect(mapJobRow(rowFrom({ ID: 'x' }), 3, collect())).toBeNull();
  });

  it('keeps bad links in the note instead of losing them', () => {
    const issues = collect();
    const job = mapJobRow(rowFrom({ ID: 'ID-2', Company: 'Acme', Timestamp: '2026-05-01', Web: 'not a link' }), 4, issues)!;
    expect(job.row.link_website).toBe('');
    expect(job.row.note).toContain('Web: not a link');
    expect(issues.list[0]).toContain('invalid Web link');
  });

  it('makes duplicate IDs unique', () => {
    const issues = collect();
    const a = mapJobRow(rowFrom({ ID: 'ID-9', Company: 'A', Timestamp: '2026-05-01' }), 2, issues)!;
    const b = mapJobRow(rowFrom({ ID: 'ID-9', Company: 'B', Timestamp: '2026-05-01' }), 3, issues)!;
    dedupeLegacyIds([a, b], issues);
    expect([a.row.legacy_id, b.row.legacy_id]).toEqual(['ID-9', 'ID-9-dup2']);
  });
});

describe('other tabs', () => {
  it('maps an interview row', () => {
    const q = mapQuestionRow(['iq_1', 'Astrology', 'Why us?', '', '', '', '', '', 'Hard', 'Mastered', '', '2026-05-01T10:00', '3'], 2, collect())!;
    expect(q.category).toBe('HR / General');
    expect(q.difficulty).toBe('Hard');
    expect(q.practice_count).toBe(3);
    expect(q.last_practiced_at).toBe('2026-05-01T10:00:00+07:00');
  });

  it('maps a recommendation row and forces https', () => {
    const r = mapRecommendationRow(['4001', 'Data Analyst', 'Acme', 'Jakarta', 'http://www.linkedin.com/jobs/view/4001/', 'email', '2026-05-01T00:00:00.000Z', 'added'], 2, collect())!;
    expect(r.url).toBe('https://www.linkedin.com/jobs/view/4001/');
    expect(r.source).toBe('email');
    expect(r.status).toBe('added');
    expect(r.dedupe_key).toContain('|');
  });
});
