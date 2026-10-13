import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';

interface SelectableRowProps {
  /** Opens the companies behind this row; without it the row is plain content. */
  onSelect?: () => void;
  /** Matches the row's bar, so the hover background is a faded version of it. */
  tone: Tone;
  label?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A card row that opens its drill-down. The hover area bleeds 0.5rem past the
 * content so rows keep their alignment with non-clickable content.
 */
export function SelectableRow({ onSelect, tone, label, className, children }: SelectableRowProps) {
  if (!onSelect) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      className={cn(
        'group -mx-2 block w-[calc(100%+1rem)] cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors',
        TONES[tone].hover,
        className
      )}
    >
      {children}
    </button>
  );
}

/** Label text that picks up the row's colour while the row is hovered. */
export const rowLabel = (tone: Tone) => cn('text-slate-700 transition-colors', TONES[tone].hoverText);
