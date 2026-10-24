import { ok, withAuth } from '@/lib/server/http';
import { parseJobForm } from '@/lib/server/jobForm';
import { deleteJob, patchJob, updateJob, type JobPatch } from '@/lib/server/repositories/jobs';
import { jobPatchSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

/** Quick updates from the board and follow-up list. Always bumps "last updated". Token OK (MCP). */
export const PATCH = withAuth<Ctx>(
  async (req, { params }, data) => {
    const { id } = await params;
    const { stage, status } = jobPatchSchema.parse(await req.json());
    const patch: JobPatch = {};
    if (stage) patch.stage = stage;
    if (status) patch.status = status;
    // A signed contract is a success unless the caller says otherwise.
    if (stage === 'Contract Signed / Done' && !status) patch.status = 'Success';
    return ok(await patchJob(data, id, patch));
  },
  { token: true }
);

/** Full update from the form; MCP uses it to attach proof files. */
export const PUT = withAuth<Ctx>(
  async (req, { params }, data) => {
    const { id } = await params;
    const { data: fields, uploads, keepAttachmentIds } = await parseJobForm(await req.formData());
    const { after } = await updateJob(data, id, fields, { keepAttachmentIds, uploads });
    return ok(after);
  },
  { token: true }
);

/** Session only: an API token can never delete. */
export const DELETE = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  await deleteJob(data, id);
  return ok(null);
});
