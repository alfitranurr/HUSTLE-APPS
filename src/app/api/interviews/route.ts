import { ok, withAuth } from '@/lib/server/http';
import { createQuestion, listQuestions } from '@/lib/server/repositories/interviews';
import { interviewCreateSchema } from '@/lib/validation';

export const GET = withAuth(async (_req, _ctx, data) => ok(await listQuestions(data)));

export const POST = withAuth(async (req, _ctx, data) => {
  const input = interviewCreateSchema.parse(await req.json());
  return ok(await createQuestion(data, input), { status: 201 });
});
