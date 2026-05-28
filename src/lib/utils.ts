/**
 * Ensures a URL starts with a protocol (http:// or https://).
 * If it doesn't, it prepends https://.
 */
export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
