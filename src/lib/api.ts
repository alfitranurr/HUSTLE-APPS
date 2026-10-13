/** Client-side helpers for calling the app's own API ({ success, data | error } envelopes). */

import { trackProgress } from './progress';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    // Every API call drives the top progress bar.
    response = await trackProgress(fetch(url, init));
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  const body = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; error?: string }
    | null;

  if (response.status === 401 && !url.startsWith('/api/auth/')) {
    window.location.assign('/login');
  }
  if (!response.ok || !body?.success) {
    throw new ApiError((body && !body.success && body.error) || 'Request failed. Please try again.', response.status);
  }
  return body.data;
}

export const fetcher = <T>(url: string) => apiFetch<T>(url);

export function jsonRequest(method: 'POST' | 'PUT' | 'PATCH', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
