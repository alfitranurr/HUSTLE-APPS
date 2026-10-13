'use client';

import type { KeyedMutator } from 'swr';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { CONTRACT_STAGES, SCHEDULED_STAGES, type JobStage } from '@/lib/constants';
import type { Job } from '@/lib/types';
import { patchJob, type JobPatchBody } from './jobApi';

/** Optimistic quick updates: the UI changes immediately and rolls back if the request fails. */
export function useJobMutations(mutate: KeyedMutator<Job[]>) {
  const toast = useToast();

  const apply = async (job: Job, body: JobPatchBody, optimistic: Job) => {
    await mutate(
      async (current) => {
        const saved = await patchJob(job.id, body);
        return current?.map((j) => (j.id === job.id ? saved : j));
      },
      {
        optimisticData: (current) => (current ?? []).map((j) => (j.id === job.id ? optimistic : j)),
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  const moveToStage = async (job: Job, stage: JobStage) => {
    if (job.stage === stage) return;
    const status = stage === 'Contract Signed / Done' ? 'Success' : job.status;
    try {
      await apply(job, { stage }, { ...job, stage, status, updatedAt: new Date().toISOString() });
      toast.success(`${job.company} moved to ${stage}.`);
      if (SCHEDULED_STAGES.includes(stage)) toast.info('Open the application to add the schedule date.');
      if (CONTRACT_STAGES.includes(stage) && !job.contractDate) toast.info('Open the application to add the contract date.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const markFollowedUp = async (job: Job) => {
    try {
      await apply(job, { followedUp: true }, { ...job, updatedAt: new Date().toISOString() });
      toast.success(`Follow-up logged for ${job.company}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return { moveToStage, markFollowedUp };
}
