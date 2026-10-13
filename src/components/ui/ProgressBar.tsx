import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = 'indigo', label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', TONES[tone].bar)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
