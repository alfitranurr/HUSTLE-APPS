'use client';

import { Building2, Check, ChevronDown, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { DIFFICULTY_TONE, STAR_PARTS } from '@/lib/constants';
import { TONES } from '@/lib/tones';
import type { InterviewQuestion } from '@/lib/types';

interface QuestionCardProps {
  question: InterviewQuestion;
  onToggleMastered: (q: InterviewQuestion) => void;
  onCheck: (q: InterviewQuestion) => void;
  onEdit: (q: InterviewQuestion) => void;
  onDelete: (q: InterviewQuestion) => void;
}

export function QuestionCard({ question: q, onToggleMastered, onCheck, onEdit, onDelete }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const mastered = q.status === 'Mastered';
  const panelId = `star-${q.id}`;

  return (
    <article
      className={cn(
        'rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm sm:p-5',
        mastered ? 'border-l-emerald-500' : 'border-l-amber-400'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="indigo">{q.category}</Badge>
            <Badge tone={DIFFICULTY_TONE[q.difficulty]}>{q.difficulty}</Badge>
            {q.targetCompany && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="size-3.5" />
                {q.targetCompany}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900">{q.question}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={mastered ? 'subtle' : 'secondary'}
            icon={<Check className="size-3.5" />}
            onClick={() => onToggleMastered(q)}
            aria-pressed={mastered}
            className={cn(mastered && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
          >
            {mastered ? 'Mastered' : 'Mark mastered'}
          </Button>
          <Button size="sm" variant="subtle" icon={<Sparkles className="size-3.5" />} onClick={() => onCheck(q)}>
            Check answer
          </Button>
          <IconButton label="Edit question" icon={<Pencil className="size-4" />} onClick={() => onEdit(q)} />
          <IconButton
            label="Delete question"
            icon={<Trash2 className="size-4" />}
            onClick={() => onDelete(q)}
            className="hover:bg-rose-50 hover:text-rose-600"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        {expanded ? 'Hide STAR draft' : 'Show STAR draft'}
        <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <dl id={panelId} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          {STAR_PARTS.map((part) => (
            <div key={part.key} className="relative overflow-hidden rounded-lg bg-slate-50 p-3 pt-4">
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', TONES[part.tone].bar)} />
              <dt className="text-xs font-semibold text-slate-700">{part.label}</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap text-slate-600">{q[part.key] || <span className="text-slate-400">Not written yet</span>}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
