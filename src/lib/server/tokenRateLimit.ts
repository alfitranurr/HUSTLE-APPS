import 'server-only';
import { rateLimit, type RateLimitResult } from './rateLimit';

/**
 * Requests per minute per API token. Shared across serverless instances via
 * Upstash Redis (REST, no SDK) when configured; otherwise the in-memory
 * limiter, which still slows a single runaway client on one instance.
 * Accepts the env names of both Upstash and Vercel's Upstash integration.
 */

export const TOKEN_REQUESTS_PER_MINUTE = 60;
const WINDOW_SECONDS = 60;

export function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/** `key` identifies the token without revealing it (a slice of its hash). */
export async function limitTokenRequest(key: string): Promise<RateLimitResult> {
  const upstash = upstashConfig();
  if (!upstash) return rateLimit(`token:${key}`, TOKEN_REQUESTS_PER_MINUTE, WINDOW_SECONDS * 1000);

  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const redisKey = `hustle:rl:token:${key}:${window}`;
  try {
    const res = await fetch(`${upstash.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${upstash.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, String(WINDOW_SECONDS * 2)],
      ]),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const [incr] = (await res.json()) as [{ result?: number; error?: string }];
    if (typeof incr?.result !== 'number') throw new Error(incr?.error ?? 'Upstash returned no count');
    const retryAfterSeconds = WINDOW_SECONDS - (Math.floor(Date.now() / 1000) % WINDOW_SECONDS);
    return { allowed: incr.result <= TOKEN_REQUESTS_PER_MINUTE, retryAfterSeconds };
  } catch (error) {
    // Redis trouble must not take the API down: fall back to the local limiter.
    console.error('[rate-limit] Upstash unavailable:', error instanceof Error ? error.message : error);
    return rateLimit(`token:${key}`, TOKEN_REQUESTS_PER_MINUTE, WINDOW_SECONDS * 1000);
  }
}
