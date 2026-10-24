import { ok, withAuth } from '@/lib/server/http';
import { getWeeklyTargets, setWeeklyTargets } from '@/lib/server/repositories/settings';
import { targetsSchema } from '@/lib/validation';

export const GET = withAuth(async (_req, _ctx, data) => ok(await getWeeklyTargets(data)));

export const PUT = withAuth(async (req, _ctx, data) => {
  const targets = targetsSchema.parse(await req.json());
  return ok(await setWeeklyTargets(data, targets));
});
