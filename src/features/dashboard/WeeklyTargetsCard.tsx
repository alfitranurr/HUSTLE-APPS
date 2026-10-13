'use client';

import { Flame, Settings2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useWeeklyTargets } from '@/hooks/useWeeklyTargets';
import { errorMessage } from '@/lib/api';
import { addDays, formatDate } from '@/lib/format';
import { weeklyProgress } from '@/lib/targets';
import { TONES, type Tone } from '@/lib/tones';
import type { Job, WeeklyTargets } from '@/lib/types';

function Ring({ value, target, label, tone }: { value: number; target: number; label: string; tone: Tone }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  const done = target > 0 && value >= target;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" role="img" aria-label={`${label}: ${value} of ${target}`}>
        <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={TONES[tone].hex}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center leading-tight">
          <span>
            <span className="block text-xl font-bold text-slate-900 tabular-nums">{value}</span>
            <span className="block text-xs text-slate-500">of {target}</span>
          </span>
        </span>
      </div>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {done && <span className="ml-1 text-emerald-600">✓</span>}
      </span>
    </div>
  );
}

function TargetsModal({ initial, onClose, onSave }: { initial: WeeklyTargets; onClose: () => void; onSave: (t: WeeklyTargets) => Promise<void> }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const number = (key: keyof WeeklyTargets, max: number) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      required
      value={values[key]}
      onChange={(e) => setValues((v) => ({ ...v, [key]: Math.max(0, Math.min(max, Number(e.target.value) || 0)) }))}
    />
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      accent="indigo"
      dismissible={!saving}
      title="Weekly targets"
      description="Set goals you can sustain every week. Weeks run Monday to Sunday."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="targets-form" loading={saving}>
            Save targets
          </Button>
        </>
      }
    >
      <form id="targets-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Applications per week">{number('applications', 100)}</Field>
        <Field label="Interviews per week">{number('interviews', 50)}</Field>
      </form>
    </Modal>
  );
}

export function WeeklyTargetsCard({ jobs, loading }: { jobs: Job[]; loading: boolean }) {
  const toast = useToast();
  const { targets, isLoading, save } = useWeeklyTargets();
  const [editing, setEditing] = useState(false);
  const progress = weeklyProgress(jobs, targets);
  const busy = loading || isLoading;

  const handleSave = async (next: WeeklyTargets) => {
    try {
      await save(next);
      toast.success('Weekly targets updated.');
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  return (
    <Card accent="indigo" className="h-full">
      <CardHeader
        title="Weekly targets"
        description={busy ? undefined : `${formatDate(progress.weekStart)} – ${formatDate(addDays(progress.weekStart, 6))}`}
        action={
          <Button variant="ghost" size="sm" icon={<Settings2 className="size-4" />} onClick={() => setEditing(true)}>
            Edit
          </Button>
        }
      />
      <CardContent className="space-y-5">
        {busy ? (
          <Skeleton className="h-40" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Ring value={progress.applications} target={targets.applications} label="Applications" tone="indigo" />
              <Ring value={progress.interviews} target={targets.interviews} label="Interviews" tone="violet" />
            </div>
            <div className="flex items-center gap-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2.5">
              <Flame className="size-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-900">
                {progress.streak > 0 ? (
                  <>
                    <span className="font-semibold">
                      {progress.streak}-week streak.
                    </span>{' '}
                    Keep hitting your application target.
                  </>
                ) : (
                  <>Hit {targets.applications} applications this week to start a streak.</>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
      {editing && <TargetsModal initial={targets} onClose={() => setEditing(false)} onSave={handleSave} />}
    </Card>
  );
}
