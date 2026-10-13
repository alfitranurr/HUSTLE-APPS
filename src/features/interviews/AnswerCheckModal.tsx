'use client';

import { CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { errorMessage } from '@/lib/api';
import { STAR_PARTS } from '@/lib/constants';
import type { GrillFeedback, InterviewQuestion } from '@/lib/types';
import { checkAnswer } from './interviewApi';

const scoreTone = (score: number) => (score >= 85 ? 'emerald' : score >= 65 ? 'amber' : 'rose');

export function AnswerCheckModal({ question, onClose }: { question: InterviewQuestion | null; onClose: () => void }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<GrillFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  if (!question) return null;
  const hasDraft = Boolean(question.situation || question.task || question.action || question.result);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      setFeedback(
        await checkAnswer({
          answer,
          situation: question.situation,
          task: question.task,
          action: question.action,
          result: question.result,
        })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      accent="amber"
      title="Answer check"
      description={question.question}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" form="answer-form" icon={<Sparkles className="size-4" />} loading={loading} disabled={!answer.trim() && !hasDraft}>
            Check answer
          </Button>
        </>
      }
    >
      <form id="answer-form" onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Your answer"
          error={error}
          hint="Rule-based STAR check: looks for each STAR part, length and measurable results. Leave empty to check your saved draft."
        >
          <Textarea data-autofocus rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write the answer as you would say it…" />
        </Field>
        {hasDraft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setAnswer(STAR_PARTS.map((p) => question[p.key] && `${p.label}: ${question[p.key]}`).filter(Boolean).join('\n'))
            }
          >
            Use my saved STAR draft
          </Button>
        )}
      </form>

      {feedback && (
        <section className="mt-6 space-y-4 rounded-xl border border-slate-200 p-4 animate-fade-in" aria-live="polite">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Score</h3>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{feedback.score}/100</span>
            </div>
            <ProgressBar value={feedback.score} tone={scoreTone(feedback.score)} label="Answer score" />
            <p className="mt-2 text-sm text-slate-600">{feedback.summary}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {feedback.parts.map((part) => {
              const meta = STAR_PARTS.find((p) => p.key === part.key)!;
              return (
                <li key={part.key} className="flex gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  {part.covered ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  )}
                  <span>
                    <span className="font-semibold text-slate-900">{meta.label}. </span>
                    <span className="text-slate-600">{part.feedback}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {feedback.suggestions.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-slate-900">Next improvements</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {feedback.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </Modal>
  );
}
