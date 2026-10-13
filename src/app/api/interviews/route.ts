import { ok, withAuth } from '@/lib/server/http';
import { createQuestion, listQuestions } from '@/lib/server/repositories/interviews';
import { interviewCreateSchema } from '@/lib/validation';

export const GET = withAuth(async () => ok(await listQuestions()));

export const POST = withAuth(async (req) => {
  const input = interviewCreateSchema.parse(await req.json());
  return ok(await createQuestion(input), { status: 201 });
});
