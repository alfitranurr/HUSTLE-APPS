'use client';

import { BookOpen, CheckCircle2, Dumbbell, PackagePlus, Play, Plus, Search, SearchX, Timer, X } from 'lucide-react';
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
import { useJobs } from '@/hooks/useJobs';
import { errorMessage } from '@/lib/api';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, MASTERY_STATUSES, PREP_STAGES } from '@/lib/constants';
import { isActive } from '@/lib/stats';
import type { InterviewQuestion, InterviewQuestionInput } from '@/lib/types';
import { AnswerCheckModal } from './AnswerCheckModal';
import { deleteQuestion, updateQuestion, useInterviews } from './interviewApi';
import { PipelineCard } from './PipelineCard';
import { practiceQueue, practisedWithin } from './practice';
import { PracticeModal } from './PracticeModal';
import { QuestionCard } from './QuestionCard';
import { QuestionModal } from './QuestionModal';
import { StarterPackModal } from './StarterPackModal';

const NO_FILTERS = { search: '', category: '', difficulty: '', status: '', company: '' };
const companyKey = (name: string) => name.trim().toLowerCase();

interface Editor {
  question: InterviewQuestion | null;
  /** Prefilled values for a new question, e.g. the company from the pipeline. */
  defaults?: Partial<InterviewQuestionInput>;
  key: number;
}

/** `initialCompany` comes from deep links such as the "Interview prep" button on an application. */
export function InterviewsView({ initialCompany = '' }: { initialCompany?: string }) {
  const toast = useToast();
  const { questions, isLoading, mutate } = useInterviews();
  const { jobs } = useJobs();
  const [filters, setFilters] = useState({ ...NO_FILTERS, company: initialCompany });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [checking, setChecking] = useState<InterviewQuestion | null>(null);
  const [deleting, setDeleting] = useState<InterviewQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [starterOpen, setStarterOpen] = useState(false);
  // The queue is fixed when a round starts so saving a round doesn't reshuffle it.
  const [practice, setPractice] = useState<{ queue: InterviewQuestion[]; key: number } | null>(null);

  const stats = useMemo(() => {
    const mastered = questions.filter((q) => q.status === 'Mastered').length;
    return {
      total: questions.length,
      mastered,
      practice: questions.length - mastered,
      practisedThisWeek: practisedWithin(questions, 7),
    };
  }, [questions]);

  const prepared = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions) {
      const key = companyKey(q.targetCompany);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [questions]);

  const pipeline = useMemo(() => jobs.filter((job) => isActive(job) && PREP_STAGES.includes(job.stage)), [jobs]);
  const companies = useMemo(
    () => [...new Set(jobs.map((job) => job.company.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [jobs]
  );

  const visible = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const company = companyKey(filters.company);
    return questions.filter(
      (q) =>
        (!query || [q.question, q.targetCompany, q.category, q.notes].join(' ').toLowerCase().includes(query)) &&
        (!filters.category || q.category === filters.category) &&
        (!filters.difficulty || q.difficulty === filters.difficulty) &&
        (!filters.status || q.status === filters.status) &&
        (!company || companyKey(q.targetCompany) === company)
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

  const openEditor = (question: InterviewQuestion | null, defaults?: Partial<InterviewQuestionInput>) =>
    setEditor({ question, defaults, key: Date.now() });
  const startPractice = () => setPractice({ queue: practiceQueue(visible), key: Date.now() });
  const filtered = visible.length !== questions.length;

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
            <Button
              variant="secondary"
              icon={<Play className="size-4" />}
              onClick={startPractice}
              disabled={visible.length === 0}
              title={filtered ? 'Practise the questions that match your filters' : undefined}
            >
              {filtered ? `Practise ${visible.length}` : 'Practise'}
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
        <StatCard
          label="Practised this week"
          value={stats.practisedThisWeek}
          hint="Questions practised in the last 7 days"
          tone="fuchsia"
          icon={<Timer className="size-4" />}
          loading={isLoading}
        />
      </div>

      {pipeline.length > 0 && (
        <PipelineCard
          jobs={pipeline}
          prepared={prepared}
          onPrep={(company) => setFilters({ ...NO_FILTERS, company })}
          onAdd={(company) => openEditor(null, { targetCompany: company })}
        />
      )}

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
        {filters.company && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 py-1 pr-1 pl-3 text-violet-700 ring-1 ring-violet-600/20 ring-inset">
              <span>
                Company: <strong className="font-semibold">{filters.company}</strong>
              </span>
              <button
                type="button"
                aria-label="Clear company filter"
                onClick={() => setFilters((f) => ({ ...f, company: '' }))}
                className="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-violet-100"
              >
                <X className="size-3.5" />
              </button>
            </span>
            <Button variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => openEditor(null, { targetCompany: filters.company })}>
              Add a question for {filters.company}
            </Button>
          </div>
        )}
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
          title={filters.company ? `No questions for ${filters.company} yet` : 'No matching questions'}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {filters.company && (
                <Button icon={<Plus className="size-4" />} onClick={() => openEditor(null, { targetCompany: filters.company })}>
                  Add a question
                </Button>
              )}
              <Button variant="secondary" onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </Button>
            </div>
          }
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
        <QuestionModal
          key={editor.key}
          open
          question={editor.question}
          defaults={editor.defaults}
          companies={companies}
          onClose={() => setEditor(null)}
          onSaved={() => void mutate()}
        />
      )}
      {starterOpen && (
        <StarterPackModal existing={questions} onClose={() => setStarterOpen(false)} onAdded={() => void mutate()} />
      )}
      {practice && (
        <PracticeModal key={practice.key} queue={practice.queue} onClose={() => setPractice(null)} onChanged={() => void mutate()} />
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
