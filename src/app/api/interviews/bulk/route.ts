import { ok, withAuth } from '@/lib/server/http';
import { createQuestions } from '@/lib/server/repositories/interviews';
import { interviewBulkCreateSchema } from '@/lib/validation';

/** Adds several questions at once (starter pack) in a single insert. */
export const POST = withAuth(async (req, _ctx, data) => {
  const { questions } = interviewBulkCreateSchema.parse(await req.json());
  return ok(await createQuestions(data, questions), { status: 201 });
});
