'use client';

import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { DIFFICULTY_TONE } from '@/lib/constants';
import type { InterviewQuestion } from '@/lib/types';
import { createQuestions } from './interviewApi';
import { STARTER_QUESTIONS } from './starterPack';

const CHECKBOX = 'mt-0.5 size-4 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 disabled:cursor-default';
const normalise = (text: string) => text.trim().toLowerCase();

interface StarterPackModalProps {
  /** Questions already in the bank; matching starters are shown as added. */
  existing: InterviewQuestion[];
  onClose: () => void;
  onAdded: () => void;
}

/** Pick common questions to add in one go; STAR answers stay for the user to write. */
export function StarterPackModal({ existing, onClose, onAdded }: StarterPackModalProps) {
  const toast = useToast();
  const added = useMemo(() => new Set(existing.map((q) => normalise(q.question))), [existing]);
  const available = STARTER_QUESTIONS.filter((q) => !added.has(normalise(q.question)));
  const [selected, setSelected] = useState(() => new Set(available.map((q) => q.question)));
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const byCategory = new Map<string, typeof STARTER_QUESTIONS>();
    for (const q of STARTER_QUESTIONS) byCategory.set(q.category, [...(byCategory.get(q.category) ?? []), q]);
    return [...byCategory];
  }, []);

  const toggle = (question: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  const allSelected = available.length > 0 && selected.size === available.length;

  const submit = async () => {
    setSaving(true);
    try {
      const questions = STARTER_QUESTIONS.filter((q) => selected.has(q.question)).map((q) => ({
        ...q,
        situation: '',
        task: '',
        action: '',
        result: '',
        targetCompany: '',
        status: 'Practice Needed' as const,
      }));
      await createQuestions(questions);
      toast.success(`${questions.length} ${questions.length === 1 ? 'question' : 'questions'} added.`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      accent="fuchsia"
      dismissible={!saving}
      title="Starter pack"
      description="Common questions for data, business and management-trainee roles, with notes on what interviewers look for. You write the STAR answers."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={selected.size === 0}>
            Add {selected.size} {selected.size === 1 ? 'question' : 'questions'}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {available.length === 0
            ? 'Every starter question is already in your bank.'
            : `${selected.size} of ${available.length} selected`}
        </span>
        {available.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(allSelected ? new Set() : new Set(available.map((q) => q.question)))}
          >
            {allSelected ? 'Select none' : 'Select all'}
          </Button>
        )}
      </div>

      <div className="gap-4 lg:columns-2">
        {groups.map(([category, questions]) => (
          <section key={category} className="mb-4 break-inside-avoid rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">{category}</h3>
            <ul className="space-y-1">
              {questions.map((q) => {
                const isAdded = added.has(normalise(q.question));
                return (
                  <li key={q.question}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 has-disabled:cursor-default has-disabled:hover:bg-transparent">
                      <input
                        type="checkbox"
                        className={CHECKBOX}
                        checked={isAdded || selected.has(q.question)}
                        disabled={isAdded}
                        onChange={() => toggle(q.question)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                          {q.question}
                          <Badge tone={DIFFICULTY_TONE[q.difficulty]}>{q.difficulty}</Badge>
                          {isAdded && (
                            <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700">
                              <Check className="size-3.5" /> In your bank
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">{q.notes}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
