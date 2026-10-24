import { NotFoundError } from '@/lib/server/db';
import { ok, withAdmin } from '@/lib/server/http';
import { isUuid } from '@/lib/server/proofs';
import { revokeUserTokens } from '@/lib/server/repositories/admin';

type Ctx = { params: Promise<{ id: string }> };

/** Turns off every access key of one account; returns how many. */
export const DELETE = withAdmin<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  if (!isUuid(id)) throw new NotFoundError('User not found');
  return ok({ count: await revokeUserTokens(data, id) });
});
