import { apiFetch, jsonRequest } from '@/lib/api';
import type { Job, JobStage, JobStatus } from '@/lib/types';

const jobUrl = (id: string) => `/api/jobs/${encodeURIComponent(id)}`;

/** Creates (no id) or replaces (id) an application from the multipart form. */
export function saveJob(form: FormData, id?: string): Promise<Job> {
  return apiFetch<Job>(id ? jobUrl(id) : '/api/jobs', { method: id ? 'PUT' : 'POST', body: form });
}

export function deleteJob(id: string): Promise<null> {
  return apiFetch<null>(jobUrl(id), { method: 'DELETE' });
}

export type JobPatchBody = { stage?: JobStage; status?: JobStatus; followedUp?: true };

/** Small update (board move or "followed up"); returns the saved job. */
export function patchJob(id: string, body: JobPatchBody): Promise<Job> {
  return apiFetch<Job>(jobUrl(id), jsonRequest('PATCH', body));
}
