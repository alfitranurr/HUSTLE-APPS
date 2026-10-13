'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, MASTERY_STATUSES, STAR_PARTS } from '@/lib/constants';
import { TONES } from '@/lib/tones';
import type { InterviewQuestion, InterviewQuestionInput } from '@/lib/types';
import { createQuestion, updateQuestion } from './interviewApi';

const EMPTY: InterviewQuestionInput = {
  category: 'Behavioral',
  question: '',
  situation: '',
  task: '',
  action: '',
  result: '',
  targetCompany: '',
  difficulty: 'Medium',
  status: 'Practice Needed',
};

interface QuestionModalProps {
  open: boolean;
  question: InterviewQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}

export function QuestionModal({ open, question, onClose, onSaved }: QuestionModalProps) {
  const toast = useToast();
  const [values, setValues] = useState<InterviewQuestionInput>(() => {
    if (!question) return EMPTY;
    const { category, question: text, situation, task, action, result, targetCompany, difficulty, status } = question;
    return { category, question: text, situation, task, action, result, targetCompany, difficulty, status };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const set = <K extends keyof InterviewQuestionInput>(key: K, value: InterviewQuestionInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.question.trim()) {
      setError('Write the question first.');
      return;
    }
    setSaving(true);
    try {
      if (question) await updateQuestion(question.id, values);
      else await createQuestion(values);
      toast.success(question ? 'Question updated.' : 'Question added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      accent="fuchsia"
      dismissible={!saving}
      title={question ? 'Edit question' : 'New practice question'}
      description="Draft your answer with the STAR method: Situation, Task, Action, Result."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" loading={saving}>
            Save question
          </Button>
        </>
      }
    >
      <form id="question-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Question" required error={error}>
          <Textarea
            data-autofocus
            rows={2}
            value={values.question}
            onChange={(e) => {
              set('question', e.target.value);
              setError(undefined);
            }}
            placeholder="Tell me about a time you handled a conflict in your team."
            aria-invalid={Boolean(error)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select options={INTERVIEW_CATEGORIES} value={values.category} onChange={(e) => set('category', e.target.value)} />
          </Field>
          <Field label="Target company" hint="Optional">
            <Input value={values.targetCompany} onChange={(e) => set('targetCompany', e.target.value)} />
          </Field>
          <Field label="Difficulty">
            <Select
              options={DIFFICULTIES}
              value={values.difficulty}
              onChange={(e) => set('difficulty', e.target.value as InterviewQuestionInput['difficulty'])}
            />
          </Field>
          <Field label="Progress">
            <Select
              options={MASTERY_STATUSES}
              value={values.status}
              onChange={(e) => set('status', e.target.value as InterviewQuestionInput['status'])}
            />
          </Field>
        </div>
        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
          {STAR_PARTS.map((part) => (
            <Field
              key={part.key}
              label={
                <span className="inline-flex items-center gap-2">
                  <span className={cn('grid size-5 place-items-center rounded text-[0.6875rem] font-bold text-white', TONES[part.tone].bar)}>
                    {part.letter}
                  </span>
                  {part.label}
                  <span className="font-normal text-slate-500">· {part.hint}</span>
                </span>
              }
            >
              <Textarea rows={2} value={values[part.key]} onChange={(e) => set(part.key, e.target.value)} />
            </Field>
          ))}
        </div>
      </form>
    </Modal>
  );
}
