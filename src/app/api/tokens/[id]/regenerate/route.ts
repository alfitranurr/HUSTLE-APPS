import { ok, withAuth } from '@/lib/server/http';
import { regenerateToken } from '@/lib/server/repositories/tokens';

type Ctx = { params: Promise<{ id: string }> };

/** New key with the same name; the old one stops working (session only). */
export const POST = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  return ok(await regenerateToken(data, id), { headers: { 'Cache-Control': 'no-store' } });
});
