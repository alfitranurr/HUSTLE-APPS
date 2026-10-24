import { ok, withAuth } from '@/lib/server/http';
import { bulkDeleteJobs, bulkUpdateJobs } from '@/lib/server/repositories/jobs';
import { jobBulkSchema } from '@/lib/validation';

/** POST { action: 'update', ids, changes } | { action: 'delete', ids } — returns how many rows were affected. */
export const POST = withAuth(async (req, _ctx, data) => {
  const body = jobBulkSchema.parse(await req.json());
  const count = body.action === 'delete' ? await bulkDeleteJobs(data, body.ids) : await bulkUpdateJobs(data, body.ids, body.changes);
  return ok({ count });
});
