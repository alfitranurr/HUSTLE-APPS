import { getAuthEnv } from './env';

/**
 * Stateless session tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Uses Web Crypto so it runs in both route handlers and proxy.ts.
 */

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  sub: string; // owner email
  exp: number; // expiry, ms since epoch
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function importKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  try {
    const key = await importKey(secret);
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(body));
    if (!valid) return null;

    const payload: unknown = JSON.parse(decoder.decode(fromBase64Url(body)));
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as SessionPayload).sub !== 'string' ||
      typeof (payload as SessionPayload).exp !== 'number' ||
      Date.now() > (payload as SessionPayload).exp
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Returns the session only when the token is valid AND belongs to the configured owner. */
export async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const { JWT_SECRET, OWNER_EMAIL } = getAuthEnv();
  const payload = await verifySession(token, JWT_SECRET);
  return payload && payload.sub === OWNER_EMAIL ? payload : null;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
