import { ok, withAuth } from '@/lib/server/http';
import { recordPractice } from '@/lib/server/repositories/interviews';

type Ctx = { params: Promise<{ id: string }> };

/** Records one practice round for a question. */
export const POST = withAuth<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  return ok(await recordPractice(id));
});
