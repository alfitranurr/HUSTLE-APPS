import { deleteJobById, findJobById, JobNotFoundError, saveJob } from '@/lib/googleSheets';
import { HttpError, ok, withAuth } from '@/lib/server/http';
import { buildJobFromForm, trashFiles } from '@/lib/server/jobForm';
import { getProofUrls } from '@/lib/utils';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const existing = await findJobById(id);
  if (!existing) throw new HttpError(404, 'Application not found');

  const { input, removedUrls } = await buildJobFromForm(await req.formData(), existing);
  await saveJob({ ...input, id });
  await trashFiles(removedUrls);
  return ok(null);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  try {
    const job = await deleteJobById(id);
    await trashFiles(getProofUrls(job.buktiurl));
    return ok(null);
  } catch (error) {
    if (error instanceof JobNotFoundError) throw new HttpError(404, error.message);
    throw error;
  }
});
