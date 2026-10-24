import { describe, expect, it } from 'vitest';
import { bearerToken, generateToken, hashToken, TOKEN_PATTERN, tokenAllowed } from './apiToken';

describe('generateToken', () => {
  it('makes hst_ tokens with a matching prefix and hash', () => {
    const { token, prefix, hash } = generateToken();
    expect(token).toMatch(TOKEN_PATTERN);
    expect(prefix).toBe(token.slice(0, 8));
    expect(prefix).toMatch(/^hst_[A-Za-z0-9]{4}$/); // the database check on token_prefix
    expect(hash).toBe(hashToken(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/); // the database check on token_hash
  });

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateToken().token));
    expect(tokens.size).toBe(200);
  });
});

describe('bearerToken', () => {
  const token = generateToken().token;

  it('reads a well-formed bearer token', () => {
    expect(bearerToken(`Bearer ${token}`)).toBe(token);
    expect(bearerToken(`bearer ${token}`)).toBe(token);
  });

  it('ignores anything else', () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken(token)).toBeNull();
    expect(bearerToken('Bearer abc')).toBeNull();
    expect(bearerToken(`Basic ${token}`)).toBeNull();
    expect(bearerToken(`Bearer ${token}x`)).toBeNull();
  });
});

describe('tokenAllowed', () => {
  it('lets the MCP tools list, add and update applications', () => {
    expect(tokenAllowed('GET', '/api/jobs')).toBe(true);
    expect(tokenAllowed('POST', '/api/jobs')).toBe(true);
    expect(tokenAllowed('PUT', '/api/jobs/123')).toBe(true);
    expect(tokenAllowed('PATCH', '/api/jobs/123')).toBe(true);
    expect(tokenAllowed('POST', '/api/mcp')).toBe(true);
  });

  it('refuses deletes, bulk and every other area', () => {
    expect(tokenAllowed('DELETE', '/api/jobs/123')).toBe(false);
    expect(tokenAllowed('POST', '/api/jobs/bulk')).toBe(false);
    expect(tokenAllowed('GET', '/api/settings')).toBe(false);
    expect(tokenAllowed('POST', '/api/tokens')).toBe(false);
    expect(tokenAllowed('GET', '/api/admin/users')).toBe(false);
    expect(tokenAllowed('GET', '/api/attachments/1')).toBe(false);
    expect(tokenAllowed('DELETE', '/api/account')).toBe(false);
  });
});
