import { trashFiles } from '@/lib/server/google/drive';
import { ok, withAuth } from '@/lib/server/http';
import { bulkDeleteJobs, bulkUpdateJobs } from '@/lib/server/repositories/jobs';
import { jobBulkSchema } from '@/lib/validation';

/** POST { action: 'update', ids, changes } | { action: 'delete', ids } — returns how many rows were affected. */
export const POST = withAuth(async (req) => {
  const body = jobBulkSchema.parse(await req.json());

  if (body.action === 'delete') {
    const deleted = await bulkDeleteJobs(body.ids);
    await trashFiles(deleted.flatMap((job) => job.attachments));
    return ok({ count: deleted.length });
  }

  const updated = await bulkUpdateJobs(body.ids, body.changes);
  return ok({ count: updated.length });
});
