import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { STAGE_TONE, STATUS_TONE, type JobStage, type JobStatus } from '@/lib/constants';
import { TONES, type Tone } from '@/lib/tones';

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'slate', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone].badge,
        className
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', TONES[tone].bar)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {status}
    </Badge>
  );
}

export function StageBadge({ stage }: { stage: JobStage }) {
  return <Badge tone={STAGE_TONE[stage]}>{stage}</Badge>;
}
