import { ok, withAuth } from '@/lib/server/http';
import { deleteQuestion, updateQuestion } from '@/lib/server/repositories/interviews';
import { interviewUpdateSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  // Unknown keys are stripped: only whitelisted fields can be changed.
  const changes = interviewUpdateSchema.parse(await req.json());
  return ok(await updateQuestion(id, changes));
});

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  await deleteQuestion(id);
  return ok(null);
});
