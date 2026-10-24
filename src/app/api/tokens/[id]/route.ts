import { ok, withAuth } from '@/lib/server/http';
import { deleteToken } from '@/lib/server/repositories/tokens';

type Ctx = { params: Promise<{ id: string }> };

/** Deletes a turned-off key for good (session only). Turning off is POST …/revoke. */
export const DELETE = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  await deleteToken(data, id);
  return ok(null);
});
