'use client';

import { Building2, Check, Eye, EyeOff, Pause, Play, RotateCcw, SkipForward, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { DIFFICULTY_TONE, NOTES_ONLY_CATEGORIES, STAR_PARTS } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { InterviewQuestion } from '@/lib/types';
import { recordPractice, updateQuestion } from './interviewApi';
import { formatClock, PRACTICE_SECONDS } from './practice';

interface PracticeModalProps {
  /** Questions in the order they are asked (see practiceQueue). */
  queue: InterviewQuestion[];
  onClose: () => void;
  /** Called after each saved round so the list can refresh. */
  onChanged: () => void;
}

/** One question at a time: answer out loud against a two-minute timer, then compare with your notes. */
export function PracticeModal({ queue, onClose, onChanged }: PracticeModalProps) {
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [saving, setSaving] = useState<'practised' | 'mastered' | null>(null);
  const [done, setDone] = useState({ practised: 0, mastered: 0 });

  const question = queue[index];
  const finished = index >= queue.length;

  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, finished]);

  const next = () => {
    setIndex((i) => i + 1);
    setRevealed(false);
    setSeconds(0);
    setRunning(true);
  };

  const finishRound = async (mastered: boolean) => {
    if (!question) return;
    setSaving(mastered ? 'mastered' : 'practised');
    try {
      await recordPractice(question.id);
      if (mastered && question.status !== 'Mastered') await updateQuestion(question.id, { status: 'Mastered' });
      setDone((d) => ({ practised: d.practised + 1, mastered: d.mastered + Number(mastered) }));
      onChanged();
      next();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  if (finished) {
    return (
      <Modal
        open
        onClose={onClose}
        size="md"
        accent="emerald"
        title="Practice round complete"
        footer={<Button onClick={onClose}>Close</Button>}
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <Trophy className="size-6" />
          </span>
          <p className="text-sm text-slate-700">
            You practised <strong className="font-semibold text-slate-900">{done.practised}</strong> of {queue.length}{' '}
            {queue.length === 1 ? 'question' : 'questions'}
            {done.mastered > 0 && (
              <>
                {' '}
                and marked <strong className="font-semibold text-slate-900">{done.mastered}</strong> as mastered
              </>
            )}
            .
          </p>
        </div>
      </Modal>
    );
  }

  const notesOnly = NOTES_ONLY_CATEGORIES.includes(question.category);
  const overtime = seconds >= PRACTICE_SECONDS;
  const hasDraft = STAR_PARTS.some((p) => question[p.key]);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      accent="fuchsia"
      dismissible={!saving}
      title={`Practice · ${index + 1} of ${queue.length}`}
      description={notesOnly ? 'Explain the topic out loud as if the test were now.' : 'Answer out loud, then compare with your notes.'}
      footer={
        <>
          <Button variant="ghost" icon={<SkipForward className="size-4" />} onClick={next} disabled={Boolean(saving)}>
            Skip
          </Button>
          <Button
            variant="secondary"
            icon={<Check className="size-4" />}
            onClick={() => finishRound(true)}
            loading={saving === 'mastered'}
            disabled={Boolean(saving)}
          >
            Mastered
          </Button>
          <Button onClick={() => finishRound(false)} loading={saving === 'practised'} disabled={Boolean(saving)}>
            Practised · next
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="indigo">{question.category}</Badge>
            <Badge tone={DIFFICULTY_TONE[question.difficulty]}>{question.difficulty}</Badge>
            {question.targetCompany && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="size-3.5" />
                {question.targetCompany}
              </span>
            )}
            <span className="text-xs text-slate-500">
              ·{' '}
              {question.practiceCount > 0
                ? `Practised ${question.practiceCount}× · last ${formatRelative(question.lastPracticedAt)}`
                : 'First time'}
            </span>
          </div>
          <p className="text-xl font-semibold text-slate-900">{question.question}</p>
        </div>

        <div className={cn('rounded-xl border p-4', overtime ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200')}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600" aria-live="polite">
              {overtime ? 'Time is up. Wrap up with your result.' : running ? 'Answer out loud…' : 'Paused'}
            </span>
            <span className="flex items-center gap-1">
              <span className={cn('mr-2 text-2xl font-bold tabular-nums', overtime ? 'text-amber-700' : 'text-slate-900')}>
                {formatClock(seconds)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                icon={running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                onClick={() => setRunning((r) => !r)}
              >
                {running ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="size-3.5" />}
                onClick={() => {
                  setSeconds(0);
                  setRunning(true);
                }}
              >
                Restart
              </Button>
            </span>
          </div>
          <ProgressBar
            value={(Math.min(seconds, PRACTICE_SECONDS) / PRACTICE_SECONDS) * 100}
            tone={overtime ? 'amber' : 'fuchsia'}
            label="Time used of two minutes"
          />
        </div>

        <div>
          <Button
            variant="subtle"
            icon={revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? 'Hide my notes' : notesOnly ? 'Show study notes' : 'Show my STAR draft & notes'}
          </Button>
          {revealed && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {!notesOnly && (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {STAR_PARTS.map((part) => (
                    <div key={part.key} className="relative overflow-hidden rounded-lg bg-slate-50 p-3 pt-4">
                      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', TONES[part.tone].bar)} />
                      <dt className="text-xs font-semibold text-slate-700">{part.label}</dt>
                      <dd className="mt-1 text-sm whitespace-pre-wrap text-slate-600">
                        {question[part.key] || <span className="text-slate-400">Not written yet</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {(notesOnly || question.notes) && (
                <div className="rounded-lg border-l-4 border-amber-300 bg-amber-50/60 p-3">
                  <p className="text-xs font-semibold text-slate-700">{notesOnly ? 'Study notes' : 'Notes'}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-slate-600">
                    {question.notes || <span className="text-slate-400">Not written yet</span>}
                  </p>
                </div>
              )}
              {!notesOnly && !hasDraft && (
                <p className="text-xs text-slate-500">
                  No STAR draft yet. Write one with Edit after this round so you have something to compare against.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
