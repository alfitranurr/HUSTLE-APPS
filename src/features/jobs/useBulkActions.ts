'use client';

import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { Job } from '@/lib/types';
import { bulkJobs, type BulkRequest } from './jobApi';

/** Runs a bulk request, reports the outcome and refreshes the list. */
export function useBulkActions(mutate: KeyedMutator<Job[]>) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (body: BulkRequest, success: (count: number) => string): Promise<boolean> => {
    setBusy(true);
    try {
      const { count } = await bulkJobs(body);
      toast.success(success(count));
      await mutate();
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, run };
}
