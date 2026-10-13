import { addInterviewQuestion, fetchInterviewQuestions } from '@/lib/googleSheets';
import { ok, withAuth } from '@/lib/server/http';
import { interviewSchema } from '@/lib/validation';

export const GET = withAuth(async () => ok(await fetchInterviewQuestions()));

export const POST = withAuth(async (req) => {
  const input = interviewSchema.parse(await req.json());
  return ok(await addInterviewQuestion(input), { status: 201 });
});
