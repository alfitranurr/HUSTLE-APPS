import { ok, withAuth } from '@/lib/server/http';
import { parseJobForm } from '@/lib/server/jobForm';
import { createJob, listJobs } from '@/lib/server/repositories/jobs';

export const GET = withAuth(async () => ok(await listJobs()));

export const POST = withAuth(async (req) => {
  const { data } = await parseJobForm(await req.formData());
  return ok(await createJob(data), { status: 201 });
});
