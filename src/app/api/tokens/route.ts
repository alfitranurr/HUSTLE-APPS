import { z } from 'zod';
import { ok, withAuth } from '@/lib/server/http';
import { createToken, listTokens } from '@/lib/server/repositories/tokens';

const createSchema = z.object({ name: z.string().trim().min(1, 'is required').max(60) });

// Session only (no { token: true }): a token can never create or list tokens.
export const GET = withAuth(async (_req, _ctx, data) => ok(await listTokens(data)));

export const POST = withAuth(async (req, _ctx, data) => {
  const { name } = createSchema.parse(await req.json());
  return ok(await createToken(data, name), { status: 201, headers: { 'Cache-Control': 'no-store' } });
});
