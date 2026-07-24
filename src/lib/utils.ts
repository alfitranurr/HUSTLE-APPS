/**
 * Ensures a URL starts with a protocol (http:// or https://).
 * If it doesn't, it prepends https://.
 */
export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getProofUrls(buktiurl?: string): string[] {
  if (!buktiurl || buktiurl === 'No File') return [];
  return buktiurl
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && url !== 'No File');
}

