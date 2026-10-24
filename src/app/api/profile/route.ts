import { ok, withAuth } from '@/lib/server/http';
import { getProfile, saveProfile } from '@/lib/server/repositories/profile';
import { profileInputSchema } from '@/lib/validation';

export const GET = withAuth(async (_req, _ctx, data) => ok(await getProfile(data)));

export const PUT = withAuth(async (req, _ctx, data) => {
  const input = profileInputSchema.parse(await req.json());
  return ok(await saveProfile(data, input));
});
