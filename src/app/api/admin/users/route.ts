import { ok, withAdmin } from '@/lib/server/http';
import { listUsers } from '@/lib/server/repositories/admin';

export const GET = withAdmin(async (_req, _ctx, data) => ok(await listUsers(data)));
