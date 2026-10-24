import { ok, withAdmin } from '@/lib/server/http';
import { listAllTokens } from '@/lib/server/repositories/admin';

/** Every account's access keys (names and prefixes only, never the keys). */
export const GET = withAdmin(async (_req, _ctx, data) => ok(await listAllTokens(data)));
