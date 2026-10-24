import { ok, withAuth } from '@/lib/server/http';
import { parseJobForm } from '@/lib/server/jobForm';
import { createJob, listJobs } from '@/lib/server/repositories/jobs';

export const GET = withAuth(async (_req, _ctx, data) => ok(await listJobs(data)));

export const POST = withAuth(async (req, _ctx, data) => {
  const { data: fields, uploads } = await parseJobForm(await req.formData());
  return ok(await createJob(data, fields, uploads), { status: 201 });
});
