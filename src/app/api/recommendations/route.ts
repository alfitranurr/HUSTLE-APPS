import { ok, withAuth } from '@/lib/server/http';
import { listRecommendations } from '@/lib/server/repositories/recommendations';

export const GET = withAuth(async (_req, _ctx, data) => ok(await listRecommendations(data)));
