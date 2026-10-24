import 'server-only';
import { randomUUID } from 'node:crypto';
import { must, owned, type DataContext } from './db';
import type { ValidatedUpload } from './uploads';

/** Proof files live in the private "proofs" bucket at {userId}/{jobId}/{random}-{name}. */
const BUCKET = 'proofs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID.test(value);

/** Best-effort removal: the database change already succeeded, so only log failures. */
export async function removeFiles(ctx: DataContext, paths: string[]) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await ctx.db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) console.error('[proofs] failed to remove files:', error.message);
  }
}

/**
 * Uploads files for a job and records them. All or nothing: if any upload or
 * the insert fails, the files already uploaded are removed again.
 */
export async function addAttachments(ctx: DataContext, jobId: string, uploads: ValidatedUpload[]) {
  if (uploads.length === 0) return;
  const uploaded: { path: string; upload: ValidatedUpload }[] = [];
  try {
    for (const upload of uploads) {
      const path = `${ctx.userId}/${jobId}/${randomUUID().slice(0, 8)}-${upload.name}`;
      const { error } = await ctx.db.storage
        .from(BUCKET)
        .upload(path, upload.buffer, { contentType: upload.mimeType, upsert: false });
      if (error) throw new Error(`upload failed: ${error.message}`);
      uploaded.push({ path, upload });
    }
    must(
      await ctx.db.from('job_attachments').insert(
        uploaded.map(({ path, upload }) =>
          owned(ctx, {
            job_id: jobId,
            storage_path: path,
            file_name: upload.name,
            mime_type: upload.mimeType,
            size_bytes: upload.buffer.length,
          })
        )
      )
    );
  } catch (error) {
    await removeFiles(ctx, uploaded.map(({ path }) => path));
    throw error;
  }
}

/** Storage paths of the given attachments (or of every attachment of the given jobs). */
export async function attachmentPaths(ctx: DataContext, filter: { ids?: string[]; jobIds?: string[] }): Promise<string[]> {
  let query = ctx.db.from('job_attachments').select('storage_path').eq('user_id', ctx.userId);
  if (filter.ids) query = query.in('id', filter.ids);
  if (filter.jobIds) query = query.in('job_id', filter.jobIds);
  return must(await query).map((row: { storage_path: string }) => row.storage_path);
}

/** Deletes attachment rows of one job, then their files. */
export async function removeAttachments(ctx: DataContext, jobId: string, ids: string[]) {
  if (ids.length === 0) return;
  const rows = must(
    await ctx.db
      .from('job_attachments')
      .delete()
      .eq('user_id', ctx.userId)
      .eq('job_id', jobId)
      .in('id', ids)
      .select('storage_path')
  );
  await removeFiles(ctx, rows.map((row: { storage_path: string }) => row.storage_path));
}

/** A short-lived link to one of the user's own files, or null if it isn't theirs. */
export async function signedAttachmentUrl(ctx: DataContext, id: string): Promise<string | null> {
  if (!isUuid(id)) return null;
  const row = must(
    await ctx.db.from('job_attachments').select('storage_path').eq('user_id', ctx.userId).eq('id', id).maybeSingle()
  ) as { storage_path: string } | null;
  if (!row) return null;
  const { data, error } = await ctx.db.storage.from(BUCKET).createSignedUrl(row.storage_path, 60);
  if (error) throw new Error(`signed url failed: ${error.message}`);
  return data.signedUrl;
}
