import { NotFoundError } from '@/lib/server/db';
import { ok, withAdmin } from '@/lib/server/http';
import { isUuid } from '@/lib/server/proofs';
import { revokeAnyToken } from '@/lib/server/repositories/admin';

type Ctx = { params: Promise<{ id: string }> };

/** Turns off one access key of any account. */
export const DELETE = withAdmin<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  if (!isUuid(id)) throw new NotFoundError('Key not found');
  return ok({ turnedOff: await revokeAnyToken(data, id) });
});
