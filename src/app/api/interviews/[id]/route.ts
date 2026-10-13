import { deleteInterviewQuestion, InterviewNotFoundError, updateInterviewQuestion } from '@/lib/googleSheets';
import { HttpError, ok, withAuth } from '@/lib/server/http';
import { interviewUpdateSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

const notFound = (error: unknown): never => {
  if (error instanceof InterviewNotFoundError) throw new HttpError(404, error.message);
  throw error;
};

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  // Unknown keys are stripped: only whitelisted fields can be changed.
  const changes = interviewUpdateSchema.parse(await req.json());
  await updateInterviewQuestion(id, changes).catch(notFound);
  return ok(null);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  await deleteInterviewQuestion(id).catch(notFound);
  return ok(null);
});
