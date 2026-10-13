// Runs once per server instance: fail fast on missing or weak configuration
// instead of silently falling back to insecure defaults.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getServerEnv } = await import('@/lib/env');
    getServerEnv();
  }
}
