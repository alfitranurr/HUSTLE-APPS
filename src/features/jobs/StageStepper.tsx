import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { JOB_STAGES, STAGE_TONE, type JobStage, type JobStatus } from '@/lib/constants';
import { TONES } from '@/lib/tones';

const SHORT: Partial<Record<JobStage, string>> = {
  'Document Screening': 'Screening',
  'Assessment Test': 'Test',
  'Offering Letter': 'Offer',
  'Contract Signed / Done': 'Signed',
};

/** Horizontal pipeline; each completed step is drawn in its own stage colour. */
export function StageStepper({ stage, status }: { stage: JobStage; status: JobStatus }) {
  const current = JOB_STAGES.indexOf(stage);
  const failed = status === 'Failed';

  return (
    <ol className="flex items-start" aria-label="Recruitment stages">
      {JOB_STAGES.map((name, i) => {
        const done = i < current;
        const active = i === current;
        const tone = TONES[failed && active ? 'rose' : STAGE_TONE[name]];
        return (
          <li key={name} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? 'step' : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn('absolute top-3 right-1/2 h-0.5 w-full', i <= current ? tone.bar : 'bg-slate-200')}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-6 place-items-center rounded-full text-[11px] font-bold ring-4 ring-white',
                done || active ? `${tone.bar} text-white` : 'bg-slate-100 text-slate-400'
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'mt-1.5 hidden px-0.5 text-[11px] leading-tight sm:block',
                active ? 'font-semibold text-slate-900' : 'text-slate-500'
              )}
            >
              {SHORT[name] ?? name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
