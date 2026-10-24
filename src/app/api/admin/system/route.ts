import { ok, withAdmin } from '@/lib/server/http';
import { systemStats } from '@/lib/server/repositories/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminSystemHealth } from '@/lib/types';

/** Aggregate counts plus a few health checks. Never returns secrets, only whether they work. */
export const GET = withAdmin(async (_req, _ctx, data) => {
  const started = performance.now();
  const stats = await systemStats(data);
  const databaseLatencyMs = Math.round(performance.now() - started);

  const checks: AdminSystemHealth['checks'] = [
    {
      label: 'Database',
      status: databaseLatencyMs < 1500 ? 'ok' : 'warn',
      detail: `Responded in ${databaseLatencyMs} ms`,
    },
  ];

  // The secret key is what account deletion needs; a cheap read proves it works.
  try {
    const { error } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.push(
      error
        ? { label: 'Secret key', status: 'error', detail: 'Rejected by Supabase; account deletion will fail' }
        : { label: 'Secret key', status: 'ok', detail: 'Works (used to delete accounts and their files)' }
    );
  } catch {
    checks.push({ label: 'Secret key', status: 'error', detail: 'Missing or invalid SUPABASE_SECRET_KEY' });
  }

  checks.push(
    stats.usersPending > 0
      ? { label: 'Sign-ups', status: 'warn', detail: `${stats.usersPending} waiting for approval` }
      : { label: 'Sign-ups', status: 'ok', detail: 'Nobody waiting for approval' }
  );

  checks.push(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? { label: 'Rate limiting', status: 'ok', detail: 'Upstash configured' }
      : { label: 'Rate limiting', status: 'warn', detail: 'Upstash not set (optional; limits API token requests)' }
  );

  return ok<AdminSystemHealth>({ stats, databaseLatencyMs, checks });
});
