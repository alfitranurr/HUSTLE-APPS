import { z } from 'zod';

/**
 * Centralised, validated environment access.
 *
 * Never import this from client components: it reads secrets. It deliberately
 * avoids `server-only` so that `proxy.ts` can use the auth subset.
 */

// Vercel/CLI pulls sometimes keep surrounding quotes; strip them and treat "" as unset.
const clean = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').trim();
  return trimmed === '' ? undefined : trimmed;
};

const required = z.preprocess(clean, z.string());
const optional = z.preprocess(clean, z.string().optional());

const authSchema = z.object({
  OWNER_EMAIL: z.preprocess(clean, z.email().transform((v) => v.toLowerCase())),
  OWNER_NAME: optional,
  LOGIN_PASSWORD: z.preprocess(clean, z.string().min(8, 'must be at least 8 characters')),
  JWT_SECRET: z.preprocess(clean, z.string().min(32, 'must be at least 32 characters')),
});

const serverSchema = authSchema
  .extend({
    GOOGLE_SHEET_ID: required,
    GOOGLE_DRIVE_FOLDER_ID: required,
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    GOOGLE_REFRESH_TOKEN: optional,
    GOOGLE_SERVICE_ACCOUNT_KEY: optional,
  })
  .refine(
    (env) =>
      Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) ||
      Boolean(env.GOOGLE_SERVICE_ACCOUNT_KEY),
    {
      message: 'set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN, or GOOGLE_SERVICE_ACCOUNT_KEY',
      path: ['GOOGLE_AUTH'],
    }
  );

export type AuthEnv = z.infer<typeof authSchema>;
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

let authEnv: AuthEnv | undefined;
let serverEnv: ServerEnv | undefined;

export function getAuthEnv(): AuthEnv {
  authEnv ??= parse(authSchema);
  return authEnv;
}

export function getServerEnv(): ServerEnv {
  serverEnv ??= parse(serverSchema);
  return serverEnv;
}
