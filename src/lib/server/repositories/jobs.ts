import 'server-only';
import type { JobStage, JobStatus } from '@/lib/constants';
import { parseDate, toDateKey } from '@/lib/format';
import { advanceStageDates } from '@/lib/stageDates';
import type { Job } from '@/lib/types';
import { must, NotFoundError, owned, type DataContext } from '../db';
import { addAttachments, attachmentPaths, isUuid, removeAttachments, removeFiles } from '../proofs';
import type { ValidatedUpload } from '../uploads';
import { JOB_SELECT, jobDataToRow, rowToJob, type JobData, type JobRow } from './jobMapper';

export type { JobData };

const now = () => new Date().toISOString();

/** Splits long id lists so `in (...)` filters stay well inside URL limits. */
function chunks<T>(items: T[], size = 100): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

// --- reads ----------------------------------------------------------------------

export async function listJobs(ctx: DataContext): Promise<Job[]> {
  const rows = must(
    await ctx.db.from('jobs').select(JOB_SELECT).eq('user_id', ctx.userId).order('created_at', { ascending: true })
  ) as unknown as JobRow[];
  return rows.map(rowToJob);
}

export async function getJob(ctx: DataContext, id: string): Promise<Job> {
  const row = isUuid(id)
    ? (must(
        await ctx.db.from('jobs').select(JOB_SELECT).eq('user_id', ctx.userId).eq('id', id).maybeSingle()
      ) as unknown as JobRow | null)
    : null;
  if (!row) throw new NotFoundError('Application not found');
  return rowToJob(row);
}

// --- writes ---------------------------------------------------------------------

export async function createJob(ctx: DataContext, data: JobData, uploads: ValidatedUpload[] = []): Promise<Job> {
  const row = {
    ...jobDataToRow(data),
    stage_dates: advanceStageDates(data.stageDates, data.stage),
  };
  const { id } = must(await ctx.db.from('jobs').insert(owned(ctx, row)).select('id').single()) as { id: string };
  try {
    await addAttachments(ctx, id, uploads);
  } catch (error) {
    // No half-saved application without its files.
    await ctx.db.from('jobs').delete().eq('user_id', ctx.userId).eq('id', id);
    throw error;
  }
  return getJob(ctx, id);
}

/**
 * Full update from the form. `keepAttachmentIds` must be ids already on this
 * job; anything else on the job is removed (row and file).
 */
export async function updateJob(
  ctx: DataContext,
  id: string,
  data: JobData,
  files: { keepAttachmentIds: string[]; uploads: ValidatedUpload[] }
): Promise<{ before: Job; after: Job }> {
  const before = await getJob(ctx, id);
  const keep = new Set(files.keepAttachmentIds);
  const removed = before.attachments.filter((a) => !keep.has(a.id)).map((a) => a.id);

  // New files first: if they fail, nothing else has changed.
  await addAttachments(ctx, id, files.uploads);
  must(
    await ctx.db
      .from('jobs')
      .update({
        ...jobDataToRow(data),
        stage_dates: advanceStageDates(data.stageDates, data.stage, before.stage),
        updated_at: now(),
      })
      .eq('user_id', ctx.userId)
      .eq('id', id)
  );
  await removeAttachments(ctx, id, removed);
  return { before, after: await getJob(ctx, id) };
}

export type JobPatch = Partial<Pick<Job, 'stage' | 'status'>>;

/** Small updates (stage change from the board, "followed up"). Always bumps `updatedAt`. */
export async function patchJob(ctx: DataContext, id: string, patch: JobPatch): Promise<Job> {
  const job = await getJob(ctx, id);
  const stage = patch.stage ?? job.stage;
  must(
    await ctx.db
      .from('jobs')
      .update({
        stage,
        status: patch.status ?? job.status,
        stage_dates: advanceStageDates(job.stageDates, stage, job.stage),
        updated_at: now(),
      })
      .eq('user_id', ctx.userId)
      .eq('id', id)
  );
  return getJob(ctx, id);
}

export async function deleteJob(ctx: DataContext, id: string): Promise<void> {
  if (!isUuid(id)) throw new NotFoundError('Application not found');
  const paths = await attachmentPaths(ctx, { jobIds: [id] });
  const deleted = must(await ctx.db.from('jobs').delete().eq('user_id', ctx.userId).eq('id', id).select('id'));
  if (deleted.length === 0) throw new NotFoundError('Application not found');
  // Attachment rows went with the job (cascade); now the files.
  await removeFiles(ctx, paths);
}

// --- bulk -------------------------------------------------------------------------

export interface BulkChanges {
  status?: JobStatus;
  stage?: JobStage;
  /**
   * Data clean-up mode: date the new stage from the application date and keep
   * "last updated" as is, so fixing old rows doesn't reset follow-up clocks.
   */
  stageDateFromApplied?: boolean;
}

/** Applies the same change to many applications. Returns how many were updated. */
export async function bulkUpdateJobs(ctx: DataContext, ids: string[], changes: BulkChanges): Promise<number> {
  const valid = ids.filter(isUuid);
  const targets: Job[] = [];
  for (const part of chunks(valid)) {
    const rows = must(
      await ctx.db.from('jobs').select(JOB_SELECT).eq('user_id', ctx.userId).in('id', part)
    ) as unknown as JobRow[];
    targets.push(...rows.map(rowToJob));
  }

  const stamp = now();
  const updates = targets.map((job) => {
    const stage = changes.stage ?? job.stage;
    let status = changes.status ?? job.status;
    // Same rule as a single update: a signed contract is a success unless told otherwise.
    if (changes.stage === 'Contract Signed / Done' && !changes.status) status = 'Success';

    const stageDates = advanceStageDates(job.stageDates, stage, job.stage);
    const applied = parseDate(job.appliedAt);
    if (changes.stageDateFromApplied && stage !== job.stage && stage !== 'Not Started' && applied) {
      stageDates[stage] = toDateKey(applied);
    }
    const values: Record<string, unknown> = { stage, status, stage_dates: stageDates };
    if (!changes.stageDateFromApplied) values.updated_at = stamp;
    return { id: job.id, values };
  });

  // Each job gets its own stage dates, so one update per job, a few at a time.
  for (const part of chunks(updates, 8)) {
    await Promise.all(
      part.map(async ({ id, values }) =>
        must(await ctx.db.from('jobs').update(values).eq('user_id', ctx.userId).eq('id', id))
      )
    );
  }
  return updates.length;
}

/** Deletes many applications and their files. Returns how many were deleted. */
export async function bulkDeleteJobs(ctx: DataContext, ids: string[]): Promise<number> {
  const valid = ids.filter(isUuid);
  let count = 0;
  for (const part of chunks(valid)) {
    const paths = await attachmentPaths(ctx, { jobIds: part });
    const deleted = must(await ctx.db.from('jobs').delete().eq('user_id', ctx.userId).in('id', part).select('id'));
    count += deleted.length;
    await removeFiles(ctx, paths);
  }
  return count;
}
