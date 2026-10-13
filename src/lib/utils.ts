/**
 * Returns a safe absolute http(s) URL for use in an href, or '' if the value
 * can't be turned into one (e.g. javascript:, data:, protocol-relative //host).
 */
export function ensureAbsoluteUrl(url?: string): string {
  const trimmed = url?.trim();
  if (!trimmed) return '';
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

export function getProofUrls(buktiurl?: string): string[] {
  if (!buktiurl || buktiurl === 'No File') return [];
  return buktiurl
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && url !== 'No File');
}
