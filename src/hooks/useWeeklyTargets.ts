'use client';

import useSWR from 'swr';
import { apiFetch, fetcher, jsonRequest } from '@/lib/api';
import { DEFAULT_WEEKLY_TARGETS } from '@/lib/constants';
import type { WeeklyTargets } from '@/lib/types';

export function useWeeklyTargets() {
  const { data, isLoading, mutate } = useSWR<WeeklyTargets>('/api/settings', fetcher<WeeklyTargets>, {
    revalidateOnFocus: false,
  });

  const save = (targets: WeeklyTargets) =>
    mutate(apiFetch<WeeklyTargets>('/api/settings', jsonRequest('PUT', targets)), {
      optimisticData: targets,
      rollbackOnError: true,
      revalidate: false,
    });

  return { targets: data ?? DEFAULT_WEEKLY_TARGETS, isLoading, save };
}
