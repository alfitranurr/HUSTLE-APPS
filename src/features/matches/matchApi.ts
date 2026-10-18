'use client';

import useSWR from 'swr';
import { apiFetch, fetcher, jsonRequest } from '@/lib/api';
import type { CandidateProfile, ProfileInput, Recommendation, RecommendationStatus } from '@/lib/types';

const NO_ITEMS: Recommendation[] = [];

export function useProfile() {
  const { data, isLoading, mutate } = useSWR<CandidateProfile | null>('/api/profile', fetcher<CandidateProfile | null>, {
    revalidateOnFocus: false,
  });
  return { profile: data ?? null, isLoading, mutate };
}

export function useRecommendations() {
  const { data, isLoading, mutate } = useSWR<{ items: Recommendation[]; lastSync: string }>(
    '/api/recommendations',
    fetcher<{ items: Recommendation[]; lastSync: string }>,
    { revalidateOnFocus: false }
  );
  return { items: data?.items ?? NO_ITEMS, lastSync: data?.lastSync ?? '', isLoading, mutate };
}

export const saveProfile = (input: ProfileInput) => apiFetch<CandidateProfile>('/api/profile', jsonRequest('PUT', input));

export function uploadProfilePdf(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<CandidateProfile>('/api/profile/pdf', { method: 'POST', body: form });
}

export interface ImportResult {
  found: number;
  added: number;
}

export const syncGmail = () =>
  apiFetch<ImportResult & { emails: number; syncedAt: string }>('/api/recommendations/sync', { method: 'POST' });

export const importPasted = (text: string) =>
  apiFetch<ImportResult>('/api/recommendations/paste', jsonRequest('POST', { text }));

export const setRecommendationStatus = (id: string, status: RecommendationStatus) =>
  apiFetch<Recommendation>(`/api/recommendations/${encodeURIComponent(id)}`, jsonRequest('PATCH', { status }));
