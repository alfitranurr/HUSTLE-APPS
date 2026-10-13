import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

/** Spans (not divs) so the bar is valid inside clickable rows. */
export function ProgressBar({ value, tone = 'indigo', label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('block h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
    >
      <span
        className={cn('block h-full rounded-full transition-[width] duration-500', TONES[tone].bar)}
        style={{ width: `${clamped}%` }}
      />
    </span>
  );
}
