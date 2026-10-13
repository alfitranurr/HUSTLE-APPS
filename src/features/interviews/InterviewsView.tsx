'use client';

import { BookOpen, Building2, CheckCircle2, Dumbbell, PackagePlus, Plus, Search, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, MASTERY_STATUSES } from '@/lib/constants';
import type { InterviewQuestion } from '@/lib/types';
import { AnswerCheckModal } from './AnswerCheckModal';
import { deleteQuestion, updateQuestion, useInterviews } from './interviewApi';
import { QuestionCard } from './QuestionCard';
import { QuestionModal } from './QuestionModal';
import { StarterPackModal } from './StarterPackModal';

const NO_FILTERS = { search: '', category: '', difficulty: '', status: '' };

export function InterviewsView() {
  const toast = useToast();
  const { questions, isLoading, mutate } = useInterviews();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editor, setEditor] = useState<{ question: InterviewQuestion | null; key: number } | null>(null);
  const [checking, setChecking] = useState<InterviewQuestion | null>(null);
  const [deleting, setDeleting] = useState<InterviewQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [starterOpen, setStarterOpen] = useState(false);

  const stats = useMemo(() => {
    const mastered = questions.filter((q) => q.status === 'Mastered').length;
    return {
      total: questions.length,
      mastered,
      practice: questions.length - mastered,
      companies: new Set(questions.map((q) => q.targetCompany.trim().toLowerCase()).filter(Boolean)).size,
    };
  }, [questions]);

  const visible = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return questions.filter(
      (q) =>
        (!query || [q.question, q.targetCompany, q.category, q.notes].join(' ').toLowerCase().includes(query)) &&
        (!filters.category || q.category === filters.category) &&
        (!filters.difficulty || q.difficulty === filters.difficulty) &&
        (!filters.status || q.status === filters.status)
    );
  }, [questions, filters]);

  const toggleMastered = async (q: InterviewQuestion) => {
    const status = q.status === 'Mastered' ? 'Practice Needed' : 'Mastered';
    // Optimistic: flip locally, then confirm with the server.
    await mutate(
      async (current) => {
        await updateQuestion(q.id, { status });
        return current?.map((item) => (item.id === q.id ? { ...item, status } : item));
      },
      {
        optimisticData: (current) => (current ?? []).map((item) => (item.id === q.id ? { ...item, status } : item)),
        rollbackOnError: true,
        revalidate: false,
      }
    ).catch((err) => toast.error(errorMessage(err)));
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteQuestion(deleting.id);
      toast.success('Question deleted.');
      setDeleting(null);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (question: InterviewQuestion | null) => setEditor({ question, key: Date.now() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview prep"
        description="Build a bank of STAR answers and practise until they’re second nature."
        actions={
          <>
            <Button variant="secondary" icon={<PackagePlus className="size-4" />} onClick={() => setStarterOpen(true)}>
              Starter pack
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
              Add question
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Questions" value={stats.total} tone="indigo" icon={<BookOpen className="size-4" />} loading={isLoading} />
        <StatCard label="Mastered" value={stats.mastered} tone="emerald" icon={<CheckCircle2 className="size-4" />} loading={isLoading} />
        <StatCard label="Need practice" value={stats.practice} tone="amber" icon={<Dumbbell className="size-4" />} loading={isLoading} />
        <StatCard label="Target companies" value={stats.companies} tone="fuchsia" icon={<Building2 className="size-4" />} loading={isLoading} />
      </div>

      <Card accent="fuchsia" className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <span className="sr-only">Search questions</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search questions…"
              className="pl-9"
            />
          </label>
          <Select aria-label="Category" placeholder="All categories" options={INTERVIEW_CATEGORIES} value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} />
          <Select aria-label="Difficulty" placeholder="All difficulties" options={DIFFICULTIES} value={filters.difficulty} onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))} />
          <Select aria-label="Progress" placeholder="Any progress" options={MASTERY_STATUSES} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
        </div>
      </Card>

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="Your question bank is empty"
          description="Start with the starter pack (HR, behavioural, technical and test prep for data and business roles), or write your own."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button icon={<PackagePlus className="size-4" />} onClick={() => setStarterOpen(true)}>
                Add starter questions
              </Button>
              <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => openEditor(null)}>
                Write my own
              </Button>
            </div>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No matching questions"
          action={<Button variant="secondary" onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>}
        />
      ) : (
        <div className="grid items-start gap-3 2xl:grid-cols-2">
          {visible.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onToggleMastered={toggleMastered}
              onCheck={setChecking}
              onEdit={openEditor}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {editor && (
        <QuestionModal key={editor.key} open question={editor.question} onClose={() => setEditor(null)} onSaved={() => void mutate()} />
      )}
      {starterOpen && (
        <StarterPackModal existing={questions} onClose={() => setStarterOpen(false)} onAdded={() => void mutate()} />
      )}
      <AnswerCheckModal key={checking?.id} question={checking} onClose={() => setChecking(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete question?"
        description="The question and its STAR draft will be removed."
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
