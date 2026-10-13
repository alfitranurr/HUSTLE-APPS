'use client';

import useSWR from 'swr';
import { apiFetch, fetcher, jsonRequest } from '@/lib/api';
import type { GrillFeedback, InterviewQuestion, InterviewQuestionInput } from '@/lib/types';

const EMPTY: InterviewQuestion[] = [];
const url = (id: string) => `/api/interviews/${encodeURIComponent(id)}`;

export function useInterviews() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<InterviewQuestion[]>(
    '/api/interviews',
    fetcher<InterviewQuestion[]>,
    { revalidateOnFocus: false }
  );
  return { questions: data ?? EMPTY, error: error as Error | undefined, isLoading, isValidating, mutate };
}

export const createQuestion = (input: InterviewQuestionInput) =>
  apiFetch<InterviewQuestion>('/api/interviews', jsonRequest('POST', input));

export const updateQuestion = (id: string, changes: Partial<InterviewQuestionInput>) =>
  apiFetch<InterviewQuestion>(url(id), jsonRequest('PUT', changes));

export const deleteQuestion = (id: string) => apiFetch<null>(url(id), { method: 'DELETE' });

export const checkAnswer = (body: { answer: string; situation: string; task: string; action: string; result: string }) =>
  apiFetch<GrillFeedback>('/api/interviews/grill', jsonRequest('POST', body));
