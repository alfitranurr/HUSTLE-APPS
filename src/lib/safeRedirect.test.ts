import { describe, expect, it } from 'vitest';
import { safeNextPath } from './safeRedirect';

describe('safeNextPath', () => {
  it('keeps in-app paths with their query', () => {
    expect(safeNextPath('/tracker')).toBe('/tracker');
    expect(safeNextPath('/tracker?status=Success#top')).toBe('/tracker?status=Success#top');
  });

  it('falls back when nothing is given', () => {
    expect(safeNextPath(null)).toBe('/dashboard');
    expect(safeNextPath(undefined)).toBe('/dashboard');
    expect(safeNextPath('', '/login')).toBe('/login');
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    'javascript:alert(1)',
    'tracker',
    '/tracker\nSet-Cookie: x=1',
    '/\u0000',
  ])('rejects %j', (next) => {
    expect(safeNextPath(next)).toBe('/dashboard');
  });
});
