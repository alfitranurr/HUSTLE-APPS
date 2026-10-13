'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Job } from '@/lib/types';

const EMPTY: Job[] = [];

/** All applications, shared across pages through the SWR cache. */
export function useJobs() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Job[]>('/api/jobs', fetcher<Job[]>, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { jobs: data ?? EMPTY, hasData: data !== undefined, error: error as Error | undefined, isLoading, isValidating, mutate };
}
