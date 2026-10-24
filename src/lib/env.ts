import { z } from 'zod';

/**
 * Centralised, validated environment access.
 *
 * Never import this from client components: it reads secrets. Public Supabase
 * settings for the browser live in `lib/supabase/config.ts`.
 */

// Vercel/CLI pulls sometimes keep surrounding quotes; strip them and treat "" as unset.
const clean = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').trim();
  return trimmed === '' ? undefined : trimmed;
};

const required = z.preprocess(clean, z.string());

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(clean, z.url({ protocol: /^https?$/ })),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required,
  // Secret key (sb_secret_…) or the legacy service_role JWT. Server only.
  SUPABASE_SECRET_KEY: z.preprocess(clean, z.string().min(20, 'must be the Supabase secret key')),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function parse<T extends z.ZodType>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Only report variable names and rules, never the values.
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration -> ${problems}`);
  }
  return result.data;
}

let serverEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  serverEnv ??= parse(serverSchema);
  return serverEnv;
}
