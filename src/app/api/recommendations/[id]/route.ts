import { ok, withAuth } from '@/lib/server/http';
import { setRecommendationStatus } from '@/lib/server/repositories/recommendations';
import { recommendationStatusSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth<Ctx>(async (req, { params }, data) => {
  const { id } = await params;
  const { status } = recommendationStatusSchema.parse(await req.json());
  return ok(await setRecommendationStatus(data, id, status));
});
