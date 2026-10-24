/**
 * Only allow redirects to a path inside this app (no open redirect).
 * "/tracker" ok · "//evil.com" no · "https://evil.com" no · "/\evil.com" no
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
