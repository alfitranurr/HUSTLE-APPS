import { trashFiles } from '@/lib/server/google/drive';
import { ok, withAuth } from '@/lib/server/http';
import { parseJobForm } from '@/lib/server/jobForm';
import { deleteJob, getJob, patchJob, updateJob, type JobPatch } from '@/lib/server/repositories/jobs';
import { jobPatchSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

/** Quick updates from the board and follow-up list. Always bumps "last updated". */
export const PATCH = withAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const { stage, status } = jobPatchSchema.parse(await req.json());
  const patch: JobPatch = {};
  if (stage) patch.stage = stage;
  if (status) patch.status = status;
  // A signed contract is a success unless the caller says otherwise.
  if (stage === 'Contract Signed / Done' && !status) patch.status = 'Success';
  return ok(await patchJob(id, patch));
});

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
