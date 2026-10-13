import { ok, withAuth } from '@/lib/server/http';
import { getWeeklyTargets, setWeeklyTargets } from '@/lib/server/repositories/settings';
import { targetsSchema } from '@/lib/validation';

export const GET = withAuth(async () => ok(await getWeeklyTargets()));

export const PUT = withAuth(async (req) => {
  const targets = targetsSchema.parse(await req.json());
  return ok(await setWeeklyTargets(targets));
});
