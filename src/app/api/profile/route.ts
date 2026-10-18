import { ok, withAuth } from '@/lib/server/http';
import { getProfile, saveProfile } from '@/lib/server/repositories/profile';
import { profileInputSchema } from '@/lib/validation';

export const GET = withAuth(async () => ok(await getProfile()));

export const PUT = withAuth(async (req) => {
  const input = profileInputSchema.parse(await req.json());
  return ok(await saveProfile(input));
});
