import { createHash, randomBytes } from 'node:crypto';

/**
 * Per-account API tokens for the MCP server: "hst_" + 40 base62 characters.
 * Only the SHA-256 hash is stored; the first 8 characters ("hst_ab12") are
 * kept to tell tokens apart in the UI. Pure helpers, unit-tested.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const BODY_LENGTH = 40;
export const TOKEN_PATTERN = /^hst_[A-Za-z0-9]{40}$/;

export function generateToken(): { token: string; prefix: string; hash: string } {
  // Rejection sampling keeps every character equally likely (256 % 62 != 0).
  let body = '';
  while (body.length < BODY_LENGTH) {
    for (const byte of randomBytes(64)) {
      if (byte < 248 && body.length < BODY_LENGTH) body += ALPHABET[byte % 62];
    }
  }
  const token = `hst_${body}`;
  return { token, prefix: token.slice(0, 8), hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The token from "Authorization: Bearer hst_…", or null for anything else. */
export function bearerToken(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match && TOKEN_PATTERN.test(match[1]) ? match[1] : null;
}

const TOKEN_ROUTES = [
  // The built-in MCP server; its tools stay within the same limits.
  { path: /^\/api\/mcp\/?$/, methods: ['GET', 'POST', 'DELETE'] },
  { path: /^\/api\/jobs\/?$/, methods: ['GET', 'POST'] },
  { path: /^\/api\/jobs\/[^/]+\/?$/, methods: ['GET', 'PUT', 'PATCH'] },
];

/**
 * What a token may do: list, add and update applications (the MCP tools,
 * through /api/mcp or the applications API).
 * No deletes, no bulk changes, nothing outside applications.
 */
export function tokenAllowed(method: string, pathname: string): boolean {
  return TOKEN_ROUTES.some((route) => route.path.test(pathname) && route.methods.includes(method.toUpperCase()));
}
