import { ok, withAuth } from '@/lib/server/http';
import { revokeToken } from '@/lib/server/repositories/tokens';

type Ctx = { params: Promise<{ id: string }> };

/** Turns a key off (session only); it stops working right away. */
export const POST = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  await revokeToken(data, id);
  return ok(null);
});
