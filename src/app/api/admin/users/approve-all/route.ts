import { ok, withAdmin } from '@/lib/server/http';
import { approveAllPending } from '@/lib/server/repositories/admin';

/** Approves every pending account at once; returns how many. */
export const POST = withAdmin(async (_req, _ctx, data) => ok({ count: await approveAllPending(data) }));
