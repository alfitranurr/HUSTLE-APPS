import { apiFetch } from '@/lib/api';
import type { Job } from '@/lib/types';

const jobUrl = (id: string) => `/api/jobs/${encodeURIComponent(id)}`;

/** Creates (no id) or replaces (id) an application from the multipart form. */
export function saveJob(form: FormData, id?: string): Promise<Job> {
  return apiFetch<Job>(id ? jobUrl(id) : '/api/jobs', { method: id ? 'PUT' : 'POST', body: form });
}

export function deleteJob(id: string): Promise<null> {
  return apiFetch<null>(jobUrl(id), { method: 'DELETE' });
}
