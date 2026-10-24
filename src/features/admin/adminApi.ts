'use client';

import useSWR from 'swr';
import { apiFetch, fetcher, jsonRequest } from '@/lib/api';
import type { AdminSystemHealth, AdminToken, AdminUser } from '@/lib/types';

const NO_USERS: AdminUser[] = [];
export const ADMIN_USERS_KEY = '/api/admin/users';

/** Pass enabled=false to skip the request (non-admins never call it). */
export function useAdminUsers(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<AdminUser[]>(enabled ? ADMIN_USERS_KEY : null, fetcher<AdminUser[]>, {
    revalidateOnFocus: true,
  });
  return { users: data ?? NO_USERS, error, isLoading, mutate };
}

export function useSystemHealth(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<AdminSystemHealth>(
    enabled ? '/api/admin/system' : null,
    fetcher<AdminSystemHealth>,
    { revalidateOnFocus: false }
  );
  return { health: data, error, isLoading, mutate };
}

export const setUserStatus = (id: string, status: 'approved' | 'suspended') =>
  apiFetch<{ id: string; status: string }>(`/api/admin/users/${encodeURIComponent(id)}`, jsonRequest('PATCH', { status }));

export const deleteUser = (id: string) =>
  apiFetch<null>(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const approveAll = () => apiFetch<{ count: number }>('/api/admin/users/approve-all', { method: 'POST' });

// --- access keys -------------------------------------------------------------

export function useAdminTokens(enabled: boolean) {
  const { data, isLoading, mutate } = useSWR<AdminToken[]>(enabled ? '/api/admin/tokens' : null, fetcher<AdminToken[]>, {
    revalidateOnFocus: false,
  });
  return { tokens: data ?? NO_TOKENS, isLoading, mutate };
}

const NO_TOKENS: AdminToken[] = [];

export const turnOffKey = (id: string) =>
  apiFetch<{ turnedOff: boolean }>(`/api/admin/tokens/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const turnOffAllKeys = (userId: string) =>
  apiFetch<{ count: number }>(`/api/admin/users/${encodeURIComponent(userId)}/tokens`, { method: 'DELETE' });
