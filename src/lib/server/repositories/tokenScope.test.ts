import { describe, expect, it } from 'vitest';
import type { DataContext } from '../db';
import { createJob, deleteJob, getJob, listJobs, patchJob, updateJob } from './jobs';

/**
 * The API-token path uses the secret-key client, which bypasses RLS. These
 * tests run the jobs repository on a recording fake client and check that
 * every query on a table is scoped to the token owner, and that inserts and
 * uploads carry that owner.
 */

const OWNER = '11111111-1111-4111-8111-111111111111';
const JOB = '22222222-2222-4222-8222-222222222222';

interface Call {
  table: string;
  ops: { op: string; args: unknown[] }[];
}

const jobRow = {
  id: JOB,
  company: 'Acme',
  position: 'Analyst',
  applied_at: '2026-05-02T08:25:00+00:00',
  scheduled_at: null,
  contract_date: null,
  stage_dates: {},
  status: 'In Progress',
  stage: 'Document Screening',
  platform: 'LinkedIn',
  career_level: '',
  province: '',
  city: '',
  note: '',
  link_instagram: '',
  link_linkedin: '',
  link_website: '',
  link_other: '',
  created_at: '2026-05-02T08:25:00+00:00',
  updated_at: '2026-05-02T08:25:00+00:00',
  job_attachments: [{ id: '33333333-3333-4333-8333-333333333333', file_name: 'a.pdf', created_at: '2026-05-02T08:26:00+00:00' }],
};

function fakeDb() {
  const calls: Call[] = [];
  const uploads: string[] = [];
  const builder = (call: Call) => {
    const result = () => {
      const ops = call.ops.map((o) => o.op);
      if (call.table === 'job_attachments' && ops.includes('select')) return [{ storage_path: `${OWNER}/${JOB}/x-a.pdf` }];
      if (ops.includes('maybeSingle') || ops.includes('single')) return ops.includes('insert') ? { id: JOB } : jobRow;
      return ops.includes('delete') || ops.includes('select') ? [jobRow] : null;
    };
    const proxy: object = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === 'then') {
            return (resolve: (v: unknown) => void) => resolve({ data: result(), error: null });
          }
          return (...args: unknown[]) => {
            call.ops.push({ op: String(prop), args });
            return proxy;
          };
        },
      }
    );
    return proxy;
  };
  const db = {
    from(table: string) {
      const call: Call = { table, ops: [] };
      calls.push(call);
      return builder(call);
    },
    storage: {
      from: () => ({
        upload: async (path: string) => {
          uploads.push(path);
          return { error: null };
        },
        remove: async () => ({ error: null }),
      }),
    },
  };
  return { calls, uploads, ctx: { db, userId: OWNER, via: 'token' } as unknown as DataContext };
}

const scopedToOwner = (call: Call) => call.ops.some((o) => o.op === 'eq' && o.args[0] === 'user_id' && o.args[1] === OWNER);
const writes = (call: Call) => call.ops.find((o) => o.op === 'insert');

const data = {
  company: 'Acme',
  position: 'Analyst',
  appliedAt: '2026-05-02T15:25',
  scheduledAt: '',
  contractDate: '',
  stageDates: {},
  status: 'In Progress' as const,
  stage: 'Document Screening' as const,
  platform: 'LinkedIn',
  careerLevel: '',
  province: '',
  city: '',
  note: '',
  links: { instagram: '', linkedin: '', website: '', other: '' },
};
const upload = { name: 'proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') };

describe('jobs repository on the token path', () => {
  it.each([
    ['listJobs', (ctx: DataContext) => listJobs(ctx)],
    ['getJob', (ctx: DataContext) => getJob(ctx, JOB)],
    ['patchJob', (ctx: DataContext) => patchJob(ctx, JOB, { stage: 'HR Interview' })],
    ['updateJob', (ctx: DataContext) => updateJob(ctx, JOB, data, { keepAttachmentIds: [], uploads: [upload] })],
    ['deleteJob', (ctx: DataContext) => deleteJob(ctx, JOB)],
    ['createJob', (ctx: DataContext) => createJob(ctx, data, [upload])],
  ])('%s scopes every non-insert query to the owner', async (_name, run) => {
    const { calls, ctx } = fakeDb();
    await run(ctx);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls.filter((c) => !writes(c))) expect(scopedToOwner(call), JSON.stringify(call)).toBe(true);
  });

  it('inserts carry the owner explicitly (no auth.uid() with the secret key)', async () => {
    const { calls, ctx } = fakeDb();
    await createJob(ctx, data, [upload]);
    const inserts = calls.filter(writes);
    expect(inserts.map((c) => c.table)).toEqual(['jobs', 'job_attachments']);
    for (const call of inserts) {
      const rows = [writes(call)!.args[0]].flat() as Record<string, unknown>[];
      for (const row of rows) expect(row.user_id).toBe(OWNER);
    }
  });

  it("uploads proof files only into the owner's folder", async () => {
    const { uploads, ctx } = fakeDb();
    await createJob(ctx, data, [upload]);
    expect(uploads).toHaveLength(1);
    expect(uploads[0].startsWith(`${OWNER}/${JOB}/`)).toBe(true);
  });

  it('rejects ids that are not uuids before touching the database', async () => {
    const { calls, ctx } = fakeDb();
    await expect(getJob(ctx, 'ID-1777735364929')).rejects.toThrow('not found');
    await expect(deleteJob(ctx, "1' or '1'='1")).rejects.toThrow('not found');
    expect(calls).toHaveLength(0);
  });
});
