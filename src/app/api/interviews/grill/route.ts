import { scoreStarAnswer } from '@/lib/server/grill';
import { HttpError, ok, withAuth } from '@/lib/server/http';
import { grillSchema } from '@/lib/validation';

export const POST = withAuth(async (req) => {
  const input = grillSchema.parse(await req.json());
  if (!input.answer && !input.action) throw new HttpError(400, 'Write an answer first.');
  return ok(scoreStarAnswer(input));
});
