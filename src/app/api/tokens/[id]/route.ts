import { ok, withAuth } from '@/lib/server/http';
import { revokeToken } from '@/lib/server/repositories/tokens';

type Ctx = { params: Promise<{ id: string }> };

/** Revokes a token (session only). */
export const DELETE = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  await revokeToken(data, id);
  return ok(null);
});
