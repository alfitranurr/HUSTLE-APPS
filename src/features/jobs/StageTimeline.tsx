import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { JOB_STAGES, STAGE_SHORT_LABEL, STAGE_TONE, type JobStage } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { displayStageDate } from '@/lib/stageDates';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';

type StepState = 'done' | 'current' | 'failed' | 'upcoming';

function buildSteps(job: Job) {
  const current = JOB_STAGES.indexOf(job.stage);
  const failed = job.status === 'Failed';
  return JOB_STAGES.map((stage, i) => {
    const state: StepState = i < current ? 'done' : i === current ? (failed ? 'failed' : 'current') : 'upcoming';
    const date = i <= current ? displayStageDate(job, stage) : '';
    return { stage, label: STAGE_SHORT_LABEL[stage], state, date: date ? formatDate(date) : '' };
  });
}

function Dot({ stage, state, index }: { stage: JobStage; state: StepState; index: number }) {
  const tone = TONES[state === 'failed' ? 'rose' : STAGE_TONE[stage]];
  return (
    <span
      className={cn(
        'relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white',
        state === 'upcoming' ? 'bg-slate-100 text-slate-400' : `${tone.bar} text-white`,
        state === 'current' && 'ring-indigo-100'
      )}
    >
      {state === 'done' ? <Check className="size-4" /> : state === 'failed' ? <X className="size-4" /> : index + 1}
    </span>
  );
}

/**
 * Recruitment pipeline with the date each stage was reached.
 * Horizontal on wider screens, vertical on phones.
 */
export function StageTimeline({ job }: { job: Job }) {
  const steps = buildSteps(job);
  const current = JOB_STAGES.indexOf(job.stage);

  return (
    <>
      {/* Horizontal (md and up) */}
      <ol className="hidden md:flex" aria-label="Recruitment stages">
        {steps.map((step, i) => (
          <li key={step.stage} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn('absolute top-3.5 right-1/2 h-0.5 w-full', i <= current ? TONES[STAGE_TONE[step.stage]].bar : 'bg-slate-200')}
              />
            )}
            <Dot stage={step.stage} state={step.state} index={i} />
            <span className={cn('mt-2 text-xs leading-tight', i === current ? 'font-semibold text-slate-900' : 'text-slate-600')}>
              {step.label}
            </span>
            <span className={cn('mt-0.5 text-[0.6875rem] tabular-nums', step.date ? 'text-slate-500' : 'text-slate-300')}>
              {step.state === 'upcoming' ? ' ' : step.date || 'No date'}
            </span>
          </li>
        ))}
      </ol>

      {/* Vertical (phones) */}
      <ol className="space-y-0 md:hidden" aria-label="Recruitment stages">
        {steps.map((step, i) => (
          <li key={step.stage} className="relative flex items-center gap-3 pb-4 last:pb-0" aria-current={i === current ? 'step' : undefined}>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn('absolute top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2', i < current ? TONES[STAGE_TONE[steps[i + 1].stage]].bar : 'bg-slate-200')}
              />
            )}
            <Dot stage={step.stage} state={step.state} index={i} />
            <span className={cn('flex-1 text-sm', i === current ? 'font-semibold text-slate-900' : step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-700')}>
              {step.label}
            </span>
            {step.state !== 'upcoming' && (
              <span className={cn('text-xs tabular-nums', step.date ? 'text-slate-500' : 'text-slate-300')}>{step.date || 'No date'}</span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
