import { trashFiles } from '@/lib/server/google/drive';
import { ok, withAuth } from '@/lib/server/http';
import { parseJobForm } from '@/lib/server/jobForm';
import { deleteJob, getJob, updateJob } from '@/lib/server/repositories/jobs';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const existing = await getJob(id);
  const { data, removedAttachments } = await parseJobForm(await req.formData(), existing);
  const { after } = await updateJob(id, data);
  await trashFiles(removedAttachments);
  return ok(after);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const job = await deleteJob(id);
  await trashFiles(job.attachments);
  return ok(null);
});
