import { fetchJobs, saveJob } from '@/lib/googleSheets';
import { buildJobFromForm } from '@/lib/server/jobForm';
import { ok, withAuth } from '@/lib/server/http';

export const GET = withAuth(async () => ok(await fetchJobs()));

export const POST = withAuth(async (req) => {
  const { input } = await buildJobFromForm(await req.formData());
  await saveJob(input);
  return ok(null, { status: 201 });
});
