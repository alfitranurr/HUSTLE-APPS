import { ok, withAuth } from '@/lib/server/http';
import { GMAIL_SYNC_KEY, listRecommendations } from '@/lib/server/repositories/recommendations';
import { getSetting } from '@/lib/server/repositories/settings';

export const GET = withAuth(async () => {
  const [items, lastSync] = await Promise.all([listRecommendations(), getSetting(GMAIL_SYNC_KEY)]);
  return ok({ items, lastSync });
});
